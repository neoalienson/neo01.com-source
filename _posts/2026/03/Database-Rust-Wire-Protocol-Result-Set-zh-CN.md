---
title: "使用 Rust 构建 PostgreSQL 兼容数据库：通信协议与结果集序列化"
date: 2026-03-05
categories:
  - Development
tags:
  - PostgreSQL
  - Rust
  - Database Internals
excerpt: "Vaultgres 旅程第五部分：实现 PostgreSQL 通信协议。深入探讨消息框架、启动握手、扩展查询协议，以及序列化 psql 和驱动程序能理解的结果集。"
lang: zh-CN
available_langs: []
thumbnail: /assets/architecture/vaultgres_thumbnail.jpg
thumbnail_80: /assets/architecture/vaultgres_thumbnail_80.jpg
series: vaultgres-journey
canonical_lang: en
comments: true
---

在 [第四部分](/zh-CN/2026/03/Database-Rust-WAL-Crash-Recovery-ARIES/) 中，我们构建了 WAL 和崩溃恢复。我们的数据库现在可以在停电中存活。但有个问题。

**客户端实际上如何与我们的数据库对话？**

```
┌─────────────┐                          ┌─────────────┐
│   psql      │                          │  Vaultgres  │
│   client    │                          │   server    │
│             │     ??? How to talk ???  │             │
└─────────────┘                          └─────────────┘
```

我们可以发明自己的协议。但那样我们就必须从头构建客户端。

**更好的方法：** 说 PostgreSQL 的通信协议。然后 `psql`、JDBC、libpq——所有现有工具——都能直接用。

今天：在 Rust 中实现 PostgreSQL 通信协议，从启动握手到结果集序列化。

---

## 1 通信协议概述

### Frontend/Backend 模型

PostgreSQL 使用 **frontend/backend** 架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Protocol                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Client)          Backend (Server)                │
│  - psql                     - Vaultgres                     │
│  - libpq (C driver)         - Query processor               │
│  - JDBC/ODBC              - Storage engine                 │
│  - psycopg (Python)         - Transaction manager           │
│                                                              │
│  Communication: TCP/IP (usually port 5432)                  │
│  Message format: Length-prefixed binary protocol            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 消息结构

每个消息都有相同的格式：

```
┌─────────────────────────────────────────────────────────────┐
│ Message Format                                              │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┬─────────────────────────────────────────┐   │
│ │ Type (1B)   │ Length (4B, includes itself)            │   │
│ ├─────────────┴─────────────────────────────────────────┤   │
│ │ Payload (variable)                                     │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Example: SimpleQuery ('Q')
┌─────────────────────────────────────────────────────────────┐
│ 'Q' │ 0x00 0x00 0x00 0x1A │ "SELECT * FROM users\0"        │
│  1B │      4B (26 bytes)   │ variable (null-terminated)     │
└─────────────────────────────────────────────────────────────┘
```

**关键洞察：** 长度是**大端序**（网络字节顺序）且**包含自身**（不包含类型字节）。

---

### 消息类型

| 类型 | 代码 | 方向 | 目的 |
|------|------|-----------|---------|
| **StartupMessage** | (none) | F→B | 初始连接（无类型字节） |
| **AuthenticationOk** | 'R' | B→F | 登录成功 |
| **Query** | 'Q' | F→B | 简单查询（SQL 字符串） |
| **RowDescription** | 'T' | B→F | 字段元数据 |
| **DataRow** | 'D' | B→F | 实际行数据 |
| **CommandComplete** | 'C' | B→F | 查询完成 |
| **ReadyForQuery** | 'Z' | B→F | 服务器准备好下一个查询 |
| **ErrorResponse** | 'E' | B→F | 出错了 |
| **Parse** | 'P' | F→B | 扩展查询：准备 |
| **Bind** | 'B' | F→B | 扩展查询：绑定参数 |
| **Execute** | 'E' | F→B | 扩展查询：执行 |
| **Sync** | 'S' | F→B | 扩展查询：完成批次 |

F→B = Frontend to Backend, B→F = Backend to Frontend

---

## 2 连接启动

### 握手流程

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: StartupMessage (user, database, options)
    Server->>Client: AuthenticationOk
    Server->>Client: ParameterStatus (server_version, encoding, ...)
    Server->>Client: ReadyForQuery (idle)
    
    Client->>Server: Query / Extended Query
    Server->>Client: RowDescription (for SELECT)
    Server->>Client: DataRow × N
    Server->>Client: CommandComplete
    Server->>Client: ReadyForQuery (idle)
```

---

### StartupMessage

第一个消息很特殊——**没有类型字节**，只有长度：

```
┌─────────────────────────────────────────────────────────────┐
│ StartupMessage                                              │
├─────────────────────────────────────────────────────────────┤
│ Length (4B): 8 + parameters                                 │
│ Protocol Version (4B): 196608 (3.0)                         │
│ Parameters (null-terminated key=value pairs):               │
│   "user\0neo\0database\0vaultgres\0\0"                      │
└─────────────────────────────────────────────────────────────┘
```

```rust
// src/wire_protocol/startup.rs
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

pub struct StartupMessage {
    pub user: String,
    pub database: String,
    pub options: HashMap<String, String>,
}

impl StartupMessage {
    pub async fn read_from(stream: &mut TcpStream) -> Result<Self, ProtocolError> {
        // Read length (4 bytes, big-endian)
        let mut len_buf = [0u8; 4];
        stream.read_exact(&mut len_buf).await?;
        let len = u32::from_be_bytes(len_buf);

        // Read protocol version
        let mut version_buf = [0u8; 4];
        stream.read_exact(&mut version_buf).await?;
        let version = u32::from_be_bytes(version_buf);

        if version != 196608 {
            return Err(ProtocolError::UnsupportedVersion(version));
        }

        // Read parameters (null-terminated key=value pairs)
        let mut params = HashMap::new();
        let mut remaining = len - 8;  // Subtract length and version bytes

        while remaining > 1 {
            let mut key = Vec::new();
            let mut byte = [0u8; 1];
            
            loop {
                stream.read_exact(&mut byte).await?;
                remaining -= 1;
                if byte[0] == 0 { break; }
                key.push(byte[0]);
            }

            if key.is_empty() { break; }  // Empty key = end of parameters

            let mut value = Vec::new();
            loop {
                stream.read_exact(&mut byte).await?;
                remaining -= 1;
                if byte[0] == 0 { break; }
                value.push(byte[0]);
            }

            let key = String::from_utf8(key)?;
            let value = String::from_utf8(value)?;
            params.insert(key, value);
        }

        Ok(Self {
            user: params.remove("user").unwrap_or_default(),
            database: params.remove("database").unwrap_or_default(),
            options: params,
        })
    }
}
```

---

### Authentication 和 ParameterStatus

```rust
// src/wire_protocol/messages.rs
pub struct MessageBuilder {
    buffer: Vec<u8>,
}

impl MessageBuilder {
    pub fn new() -> Self {
        Self { buffer: Vec::new() }
    }

    pub fn authentication_ok(&mut self) -> &[u8] {
        // 'R' (1B) + Length (4B) + Auth Type (4B = 0 for Ok)
        self.buffer.clear();
        self.buffer.push(b'R');
        self.buffer.extend_from_slice(&12u32.to_be_bytes());  // Length
        self.buffer.extend_from_slice(&0u32.to_be_bytes());   // AuthOk
        &self.buffer
    }

    pub fn parameter_status(&mut self, name: &str, value: &str) -> &[u8] {
        // 'S' (1B) + Length (4B) + name\0 + value\0
        self.buffer.clear();
        self.buffer.push(b'S');
        
        let payload_len = 4 + name.len() + 1 + value.len() + 1;
        self.buffer.extend_from_slice(&(payload_len as u32).to_be_bytes());
        self.buffer.extend_from_slice(name.as_bytes());
        self.buffer.push(0);
        self.buffer.extend_from_slice(value.as_bytes());
        self.buffer.push(0);
        
        &self.buffer
    }

    pub fn ready_for_query(&mut self, status: TransactionStatus) -> &[u8] {
        // 'Z' (1B) + Length (4B) + Status (1B)
        self.buffer.clear();
        self.buffer.push(b'Z');
        self.buffer.extend_from_slice(&5u32.to_be_bytes());
        self.buffer.push(status as u8);
        &self.buffer
    }
}

#[derive(Debug, Clone, Copy)]
#[repr(u8)]
pub enum TransactionStatus {
    Idle = b'I',
    InTransaction = b'T',
    InFailedTransaction = b'E',
}
```

**服务器发送这些参数：**

| 参数 | 值 | 目的 |
|-----------|-------|---------|
| `server_version` | `16.0` | 我们模拟的 PostgreSQL 版本 |
| `server_encoding` | `UTF8` | 字符编码 |
| `client_encoding` | `UTF8` | 客户端的编码 |
| `integer_datetimes` | `on` | 64 位整数时间戳 |

---

## 3 简单查询协议

### 查询流程

```
Client: Query("SELECT id, name FROM users WHERE id = 1")
Server: RowDescription (column metadata)
Server: DataRow (row 1)
Server: DataRow (row 2)
...
Server: CommandComplete ("SELECT 2")
Server: ReadyForQuery ('I')
```

---

### RowDescription：告诉客户端关于字段

```rust
// src/wire_protocol/row_description.rs
pub struct FieldDescription {
    pub name: String,
    pub table_oid: u32,
    pub column_attr_num: i16,
    pub type_oid: u32,
    pub type_size: i16,
    pub type_modifier: i32,
    pub format_code: i16,  // 0 = text, 1 = binary
}

pub struct RowDescription {
    pub fields: Vec<FieldDescription>,
}

impl RowDescription {
    pub fn serialize(&self, builder: &mut MessageBuilder) -> &[u8] {
        // 'T' (1B) + Length (4B) + Num Fields (2B) + Fields...
        builder.buffer.clear();
        builder.buffer.push(b'T');
        
        // Calculate payload length
        let payload_len = 2 + (self.fields.len() * 19) + 
            self.fields.iter().map(|f| f.name.len() + 1).sum::<usize>();
        
        builder.buffer.extend_from_slice(&(payload_len as u32).to_be_bytes());
        builder.buffer.extend_from_slice(&(self.fields.len() as i16).to_be_bytes());
        
        for field in &self.fields {
            builder.buffer.extend_from_slice(field.name.as_bytes());
            builder.buffer.push(0);  // Null terminator
            builder.buffer.extend_from_slice(&field.table_oid.to_be_bytes());
            builder.buffer.extend_from_slice(&field.column_attr_num.to_be_bytes());
            builder.buffer.extend_from_slice(&field.type_oid.to_be_bytes());
            builder.buffer.extend_from_slice(&field.type_size.to_be_bytes());
            builder.buffer.extend_from_slice(&field.type_modifier.to_be_bytes());
            builder.buffer.extend_from_slice(&field.format_code.to_be_bytes());
        }
        
        &builder.buffer
    }
}
```

**范例输出：**

```
SELECT id, name FROM users

RowDescription:
┌─────────────────────────────────────────────────────────────┐
│ 'T' │ Length │ 2 fields                                     │
├─────────────────────────────────────────────────────────────┤
│ Field 1: "id"                                               │
│   table_oid: 16384                                          │
│   column_attr_num: 1                                        │
│   type_oid: 23 (INT4)                                       │
│   type_size: 4                                              │
│   type_modifier: -1                                         │
│   format_code: 0 (text)                                     │
├─────────────────────────────────────────────────────────────┤
│ Field 2: "name"                                             │
│   table_oid: 16384                                          │
│   column_attr_num: 2                                        │
│   type_oid: 25 (TEXT)                                       │
│   type_size: -1 (variable)                                  │
│   type_modifier: -1                                         │
│   format_code: 0 (text)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### DataRow：序列化实际行

```rust
// src/wire_protocol/data_row.rs
pub struct DataRow {
    pub values: Vec<Option<Vec<u8>>>,  // None = NULL
    pub format_codes: Vec<i16>,
}

impl DataRow {
    pub fn serialize(&self, builder: &mut MessageBuilder) -> &[u8] {
        // 'D' (1B) + Length (4B) + Num Values (2B) + Values...
        builder.buffer.clear();
        builder.buffer.push(b'D');
        
        // Calculate payload length
        let mut payload_len = 2u32;  // Num values
        for value in &self.values {
            payload_len += 4;  // Length prefix
            if let Some(data) = value {
                payload_len += data.len() as u32;
            }
        }
        
        builder.buffer.extend_from_slice(&payload_len.to_be_bytes());
        builder.buffer.extend_from_slice(&(self.values.len() as i16).to_be_bytes());
        
        for value in &self.values {
            match value {
                None => {
                    // NULL: length = -1
                    builder.buffer.extend_from_slice(&(-1i32).to_be_bytes());
                }
                Some(data) => {
                    // Non-NULL: length + data
                    builder.buffer.extend_from_slice(&(data.len() as i32).to_be_bytes());
                    builder.buffer.extend_from_slice(data);
                }
            }
        }
        
        &builder.buffer
    }
}
```

**范例：**

```
Row: id=1, name="Alice", email=NULL

DataRow:
┌─────────────────────────────────────────────────────────────┐
│ 'D' │ Length │ 3 values                                     │
├─────────────────────────────────────────────────────────────┤
│ Value 1: 4 bytes │ "1"                                      │
│ Value 2: 5 bytes │ "Alice"                                  │
│ Value 3: -1 (NULL)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### 文本 vs. 二进制格式

**文本格式（format_code = 0）：** 可读字符串

```
INT4: "42"
TEXT: "Alice"
TIMESTAMP: "2026-03-29 14:30:00.123456+00"
```

**二进制格式（format_code = 1）：** 原生表示

```rust
// src/wire_protocol/type_encoding.rs
pub fn encode_int4(value: i32, format: i16) -> Vec<u8> {
    match format {
        0 => value.to_string().into_bytes(),  // Text
        1 => value.to_be_bytes().to_vec(),    // Binary
        _ => panic!("Invalid format code"),
    }
}

pub fn encode_text(value: &str, format: i16) -> Vec<u8> {
    match format {
        0 => value.as_bytes().to_vec(),       // Text (UTF-8)
        1 => {
            // Binary: 4-byte length prefix + data
            let mut buf = Vec::new();
            buf.extend_from_slice(&(value.len() as i32).to_be_bytes());
            buf.extend_from_slice(value.as_bytes());
            buf
        }
        _ => panic!("Invalid format code"),
    }
}

pub fn encode_timestamp(value: chrono::DateTime<chrono::Utc>, format: i16) -> Vec<u8> {
    match format {
        0 => value.format("%Y-%m-%d %H:%M:%S%.6f%z").to_string().into_bytes(),
        1 => {
            // PostgreSQL epoch: 2000-01-01 00:00:00 UTC
            let epoch = chrono::DateTime::from_timestamp(946684800, 0).unwrap();
            let micros = value.signed_duration_since(epoch).num_microseconds().unwrap();
            micros.to_be_bytes().to_vec()
        }
        _ => panic!("Invalid format code"),
    }
}
```

---

## 4 扩展查询协议

### 为什么需要扩展查询？

**简单查询：** SQL 注入风险，无预备语句

```
Client: Query("SELECT * FROM users WHERE id = " + user_input)
→ SQL injection vulnerability!
```

**扩展查询：** 预备语句，参数绑定

```
Client: Parse("SELECT * FROM users WHERE id = $1")
Client: Bind([42])
Client: Execute()
→ Safe from SQL injection!
```

---

### 扩展查询流程

```mermaid
sequenceDiagram
    participant Client
    participant Server

    Client->>Server: Parse (SQL, parameter types)
    Server->>Client: ParseComplete

    Client->>Server: Bind (parameter values)
    Server->>Client: BindComplete

    loop Multiple executions
        Client->>Server: Execute (max_rows)
        Server->>Client: DataRow × N
    end

    Client->>Server: Sync
    Server->>Client: CommandComplete
    Server->>Client: ReadyForQuery
```

---

### Parse：准备语句

```rust
// src/wire_protocol/parse.rs
pub struct ParseMessage {
    pub statement_name: String,
    pub query: String,
    pub parameter_types: Vec<u32>,  // OID for each parameter
}

impl ParseMessage {
    pub async fn read_from(stream: &mut TcpStream) -> Result<Self, ProtocolError> {
        // statement_name (null-terminated)
        let statement_name = read_null_terminated(stream).await?;
        
        // query (null-terminated)
        let query = read_null_terminated(stream).await?;
        
        // num_parameter_types (2B)
        let mut num_types_buf = [0u8; 2];
        stream.read_exact(&mut num_types_buf).await?;
        let num_types = i16::from_be_bytes(num_types_buf);
        
        // parameter_types (4B each)
        let mut parameter_types = Vec::new();
        for _ in 0..num_types {
            let mut type_buf = [0u8; 4];
            stream.read_exact(&mut type_buf).await?;
            parameter_types.push(u32::from_be_bytes(type_buf));
        }
        
        Ok(Self {
            statement_name,
            query,
            parameter_types,
        })
    }
}

// Server response
pub fn parse_complete(builder: &mut MessageBuilder) -> &[u8] {
    // '1' (1B) + Length (4B = 4)
    builder.buffer.clear();
    builder.buffer.push(b'1');
    builder.buffer.extend_from_slice(&4u32.to_be_bytes());
    &builder.buffer
}
```

---

### Bind：创建 Portal

```rust
// src/wire_protocol/bind.rs
pub struct BindMessage {
    pub portal_name: String,
    pub statement_name: String,
    pub parameter_format_codes: Vec<i16>,
    pub parameter_values: Vec<Option<Vec<u8>>>,
    pub result_format_codes: Vec<i16>,
}

impl BindMessage {
    pub async fn read_from(stream: &mut TcpStream) -> Result<Self, ProtocolError> {
        // portal_name (null-terminated)
        let portal_name = read_null_terminated(stream).await?;
        
        // statement_name (null-terminated)
        let statement_name = read_null_terminated(stream).await?;
        
        // num_parameter_format_codes (2B)
        let num_formats = read_i16(stream).await?;
        
        // parameter_format_codes
        let mut parameter_format_codes = Vec::new();
        for _ in 0..num_formats {
            parameter_format_codes.push(read_i16(stream).await?);
        }
        
        // num_parameter_values (2B)
        let num_values = read_i16(stream).await?;
        
        // parameter_values
        let mut parameter_values = Vec::new();
        for _ in 0..num_values {
            let len = read_i32(stream).await?;
            if len == -1 {
                parameter_values.push(None);  // NULL
            } else {
                let mut data = vec![0u8; len as usize];
                stream.read_exact(&mut data).await?;
                parameter_values.push(Some(data));
            }
        }
        
        // num_result_format_codes (2B)
        let num_result_formats = read_i16(stream).await?;
        
        // result_format_codes
        let mut result_format_codes = Vec::new();
        for _ in 0..num_result_formats {
            result_format_codes.push(read_i16(stream).await?);
        }
        
        Ok(Self {
            portal_name,
            statement_name,
            parameter_format_codes,
            parameter_values,
            result_format_codes,
        })
    }
}

// Server response
pub fn bind_complete(builder: &mut MessageBuilder) -> &[u8] {
    // '2' (1B) + Length (4B = 4)
    builder.buffer.clear();
    builder.buffer.push(b'2');
    builder.buffer.extend_from_slice(&4u32.to_be_bytes());
    &builder.buffer
}
```

---

### Execute：执行预备语句

```rust
// src/wire_protocol/execute.rs
pub struct ExecuteMessage {
    pub portal_name: String,
    pub max_rows: i32,  // 0 = all rows
}

impl ExecuteMessage {
    pub async fn read_from(stream: &mut TcpStream) -> Result<Self, ProtocolError> {
        let portal_name = read_null_terminated(stream).await?;
        let max_rows = read_i32(stream).await?;
        
        Ok(Self { portal_name, max_rows })
    }
}
```

**服务器响应：** DataRow 消息（没有特定的 "ExecuteComplete" 消息）

---

### Sync：完成批次

```rust
// src/wire_protocol/sync.rs
pub struct SyncMessage;

impl SyncMessage {
    pub async fn read_from(_stream: &mut TcpStream) -> Result<Self, ProtocolError> {
        // Sync has no body, just the message header
        Ok(SyncMessage)
    }
}

// Server response
pub fn sync_complete(builder: &mut MessageBuilder, status: TransactionStatus) -> &[u8] {
    // CommandComplete + ReadyForQuery
    builder.buffer.clear();
    
    // CommandComplete: 'C' + Length + "SELECT 2\0"
    builder.buffer.push(b'C');
    let cmd = b"SELECT 2";
    builder.buffer.extend_from_slice(&((cmd.len() + 1) as u32).to_be_bytes());
    builder.buffer.extend_from_slice(cmd);
    builder.buffer.push(0);
    
    &builder.buffer
}
```

---

## 5 完整的查询执行流程

### 整合在一起

```rust
// src/wire_protocol/handler.rs
use tokio::net::TcpStream;
use crate::query_executor::QueryExecutor;
use crate::storage::buffer_pool::BufferPool;

pub struct ProtocolHandler {
    stream: TcpStream,
    executor: QueryExecutor,
    builder: MessageBuilder,
    prepared_statements: HashMap<String, PreparedStatement>,
    portals: HashMap<String, Portal>,
}

impl ProtocolHandler {
    pub async fn handle_connection(mut stream: TcpStream) -> Result<(), ProtocolError> {
        // 1. Read startup message
        let startup = StartupMessage::read_from(&mut stream).await?;
        
        // 2. Send authentication
        stream.write_all(self.builder.authentication_ok()).await?;
        
        // 3. Send parameter status
        stream.write_all(self.builder.parameter_status("server_version", "16.0")).await?;
        stream.write_all(self.builder.parameter_status("server_encoding", "UTF8")).await?;
        stream.write_all(self.builder.parameter_status("client_encoding", "UTF8")).await?;
        
        // 4. Send ready for query
        stream.write_all(self.builder.ready_for_query(TransactionStatus::Idle)).await?;
        
        // 5. Main message loop
        loop {
            let mut type_buf = [0u8; 1];
            stream.read_exact(&mut type_buf).await?;
            
            match type_buf[0] as char {
                'Q' => self.handle_simple_query(&mut stream).await?,
                'P' => self.handle_parse(&mut stream).await?,
                'B' => self.handle_bind(&mut stream).await?,
                'E' => self.handle_execute(&mut stream).await?,
                'S' => self.handle_sync(&mut stream).await?,
                'X' => {
                    // Terminate
                    return Ok(());
                }
                _ => return Err(ProtocolError::UnknownMessage(type_buf[0])),
            }
        }
    }
    
    async fn handle_simple_query(&mut self, stream: &mut TcpStream) -> Result<(), ProtocolError> {
        // Read query string
        let query = read_null_terminated(stream).await?;
        
        // Execute query
        let result = self.executor.execute(&query).await?;
        
        // Send RowDescription (if SELECT)
        if let Some(columns) = result.columns {
            let row_desc = self.create_row_description(&columns);
            stream.write_all(row_desc.serialize(&mut self.builder)).await?;
            
            // Send DataRows
            for row in result.rows {
                let data_row = self.create_data_row(&row);
                stream.write_all(data_row.serialize(&mut self.builder)).await?;
            }
        }
        
        // Send CommandComplete
        self.builder.command_complete(&result.command_tag);
        stream.write_all(&self.builder.buffer).await?;
        
        // Send ReadyForQuery
        stream.write_all(self.builder.ready_for_query(TransactionStatus::Idle)).await?;
        
        Ok(())
    }
}
```

---

### 结果集序列化范例

```rust
// src/wire_protocol/result_set.rs
pub struct ResultSet {
    pub columns: Vec<Column>,
    pub rows: Vec<Row>,
    pub command_tag: String,
}

pub struct Column {
    pub name: String,
    pub type_oid: u32,
    pub type_size: i16,
}

pub struct Row {
    pub values: Vec<Option<String>>,
}

impl ResultSet {
    pub fn send_to(&self, stream: &mut TcpStream, builder: &mut MessageBuilder) -> Result<(), io::Error> {
        // RowDescription
        let fields: Vec<FieldDescription> = self.columns.iter().map(|col| {
            FieldDescription {
                name: col.name.clone(),
                table_oid: 0,
                column_attr_num: 0,
                type_oid: col.type_oid,
                type_size: col.type_size,
                type_modifier: -1,
                format_code: 0,  // Text format
            }
        }).collect();
        
        let row_desc = RowDescription { fields };
        stream.write_all(row_desc.serialize(builder))?;
        
        // DataRows
        for row in &self.rows {
            let values: Vec<Option<Vec<u8>>> = row.values.iter()
                .map(|v| v.as_ref().map(|s| s.as_bytes().to_vec()))
                .collect();
            
            let data_row = DataRow {
                values,
                format_codes: vec![0; self.columns.len()],
            };
            stream.write_all(data_row.serialize(builder))?;
        }
        
        // CommandComplete
        builder.command_complete(&self.command_tag);
        stream.write_all(&builder.buffer)?;
        
        Ok(())
    }
}

// Usage example
let result = ResultSet {
    columns: vec![
        Column { name: "id".to_string(), type_oid: 23, type_size: 4 },
        Column { name: "name".to_string(), type_oid: 25, type_size: -1 },
    ],
    rows: vec![
        Row { values: vec![Some("1".to_string()), Some("Alice".to_string())] },
        Row { values: vec![Some("2".to_string()), Some("Bob".to_string())] },
    ],
    command_tag: "SELECT 2".to_string(),
};

result.send_to(&mut stream, &mut builder)?;
```

**psql 接收的内容：**

```
┌─────────────────────────────────────────────────────────────┐
│ T (RowDescription)                                          │
│   2 columns: id (INT4), name (TEXT)                         │
├─────────────────────────────────────────────────────────────┤
│ D (DataRow)                                                 │
│   id=1, name="Alice"                                        │
├─────────────────────────────────────────────────────────────┤
│ D (DataRow)                                                 │
│   id=2, name="Bob"                                          │
├─────────────────────────────────────────────────────────────┤
│ C (CommandComplete)                                         │
│   "SELECT 2"                                                │
├─────────────────────────────────────────────────────────────┤
│ Z (ReadyForQuery)                                           │
│   Status: Idle                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6 PostgreSQL 类型 OID

### 常见类型

| 类型名称 | OID | 大小 | 说明 |
|-----------|-----|------|-------------|
| `BOOL` | 16 | 1 | 布尔值 |
| `INT2` (SMALLINT) | 21 | 2 | 2 字节整数 |
| `INT4` (INTEGER) | 23 | 4 | 4 字节整数 |
| `INT8` (BIGINT) | 20 | 8 | 8 字节整数 |
| `TEXT` | 25 | -1 | 可变长度文本 |
| `VARCHAR` | 1043 | -1 | 可变长度字符 |
| `TIMESTAMP` | 1114 | 8 | 无时区时间戳 |
| `TIMESTAMPTZ` | 1184 | 8 | 有时区时间戳 |
| `FLOAT4` (REAL) | 700 | 4 | 4 字节浮点数 |
| `FLOAT8` (DOUBLE) | 701 | 8 | 8 字节浮点数 |
| `NUMERIC` | 1700 | -1 | 任意精度 |
| `BYTEA` | 17 | -1 | 二进制数据 |
| `OID` | 26 | 4 | 对象标识符 |

```rust
// src/wire_protocol/oids.rs
pub mod oid {
    pub const BOOL: u32 = 16;
    pub const INT2: u32 = 21;
    pub const INT4: u32 = 23;
    pub const INT8: u32 = 20;
    pub const TEXT: u32 = 25;
    pub const VARCHAR: u32 = 1043;
    pub const TIMESTAMP: u32 = 1114;
    pub const TIMESTAMPTZ: u32 = 1184;
    pub const FLOAT4: u32 = 700;
    pub const FLOAT8: u32 = 701;
    pub const NUMERIC: u32 = 1700;
    pub const BYTEA: u32 = 17;
    pub const OID: u32 = 26;
}
```

---

## 7 用 Rust 构建的挑战

### 挑战 1：异步 I/O 和借用

**问题：** tokio 需要 `&mut self` 进行异步 I/O，但我们需要从 self 借用。

```rust
// ❌ Doesn't compile
impl ProtocolHandler {
    pub async fn handle_query(&mut self) -> Result<(), Error> {
        let query = self.read_query().await?;  // Borrows self
        let result = self.executor.execute(&query).await?;  // Also borrows self!
        // Error: cannot borrow as mutable more than once
    }
}
```

**解决方案：重构以避免同时借用**

```rust
// ✅ Works
impl ProtocolHandler {
    pub async fn handle_query(&mut self) -> Result<(), Error> {
        let query = self.read_query().await?;
        
        // Release borrow before next operation
        let result = {
            self.executor.execute(&query).await?
        };
        
        self.send_result(result).await?;
        Ok(())
    }
}
```

---

### 挑战 2：零拷贝 vs. 分配

**问题：** 通信协议消息需要序列化。拷贝很昂贵。

```rust
// ❌ Allocates on every message
pub fn serialize_row(&self) -> Vec<u8> {
    let mut buffer = Vec::new();
    buffer.push(b'D');
    // ... lots of allocations ...
    buffer
}
```

**解决方案：重用缓冲区**

```rust
// ✅ Reuses allocated buffer
pub struct MessageBuilder {
    buffer: Vec<u8>,  // Pre-allocated, reused
}

impl MessageBuilder {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            buffer: Vec::with_capacity(capacity),
        }
    }
    
    pub fn data_row(&mut self, row: &Row) -> &[u8] {
        self.buffer.clear();  // Reuse capacity
        self.buffer.push(b'D');
        // ... write to buffer ...
        &self.buffer  // Return reference, not owned
    }
}
```

---

### 挑战 3：跨层错误处理

**问题：** 通信协议错误、查询错误、存储错误——所有不同的类型。

```rust
// ❌ Error type explosion
pub enum Error {
    Io(io::Error),
    Protocol(ProtocolError),
    Query(QueryError),
    Storage(StorageError),
    Transaction(TransactionError),
    // ... 20 more variants ...
}
```

**解决方案：使用 `thiserror` 和转换特性**

```rust
// ✅ Clean error handling
#[derive(Debug, thiserror::Error)]
pub enum ProtocolError {
    #[error("IO error: {0}")]
    Io(#[from] io::Error),
    
    #[error("Invalid message type: {0}")]
    UnknownMessage(u8),
    
    #[error("Query error: {0}")]
    Query(#[from] QueryError),
}

// Use ? operator for automatic conversion
pub async fn handle_query(&mut self) -> Result<(), ProtocolError> {
    let query = self.read_query().await?;  // io::Error → ProtocolError
    let result = self.executor.execute(&query).await?;  // QueryError → ProtocolError
    Ok(())
}
```

---

## 8 AI 如何加速这项工作

### AI 做对了什么

| 任务 | AI 贡献 |
|------|-----------------|
| **消息格式** | 正确的大端序编码 |
| **扩展查询流程** | Parse → Bind → Execute 顺序 |
| **类型 OID** | 准确的 PostgreSQL 类型 OID |
| **NULL 处理** | NULL 的 -1 长度前缀 |

---

### AI 做错了什么

| 问题 | 发生什么事 |
|-------|---------------|
| **长度计算** | 初稿没有在长度中包含长度字节 |
| **启动消息** | 尝试添加类型字节（启动没有！） |
| **二进制格式** | 建议小端序（PostgreSQL 使用大端序） |
| **Portal 生命周期** | 忽略了 portal 在 Execute 后被销毁 |

**模式：** 通信协议很精确。差一错误会破坏一切。

---

### 范例：调试 psql 连接

**我问 AI 的问题：**

> "psql 连接但立即断开。什么错了？"

**我学到的：**

1. psql 期望特定的 ParameterStatus 消息
2. 缺少 `server_version` 会导致无声断开
3. ReadyForQuery 必须在验证后发送

**结果：** 添加了必需的参数：

```rust
stream.write_all(self.builder.parameter_status("server_version", "16.0")).await?;
stream.write_all(self.builder.parameter_status("server_encoding", "UTF8")).await?;
stream.write_all(self.builder.parameter_status("client_encoding", "UTF8")).await?;
stream.write_all(self.builder.ready_for_query(TransactionStatus::Idle)).await?;
```

**现在 psql 连接成功！**

```
$ psql -h localhost -p 5432 -U neo vaultgres
psql (16.0, server 16.0 (Vaultgres))
Type "help" for help.

vaultgres=> SELECT 1;
 ?column? 
----------
        1
(1 row)
```

---

## 总结：通信协议一张图

```mermaid
flowchart TD
    subgraph "Connection Startup"
        A[Client connects] --> B[StartupMessage]
        B --> C[AuthenticationOk]
        C --> D[ParameterStatus]
        D --> E[ReadyForQuery]
    end

    subgraph "Simple Query"
        F[Query 'Q'] --> G[RowDescription 'T']
        G --> H[DataRow 'D' × N]
        H --> I[CommandComplete 'C']
        I --> E
    end

    subgraph "Extended Query"
        J[Parse 'P'] --> K[ParseComplete '1']
        K --> L[Bind 'B']
        L --> M[BindComplete '2']
        M --> N[Execute 'E']
        N --> H
        O[Sync 'S'] --> I
    end

    subgraph "Message Format"
        P[Type 1B] --> Q[Length 4B BE]
        Q --> R[Payload]
    end

    subgraph "Result Serialization"
        S[Row: id=1, name='Alice'] --> T[DataRow: 'D' + len + values]
    end

    style B fill:#e3f2fd,stroke:#1976d2
    style F fill:#e8f5e9,stroke:#388e3c
    style J fill:#e8f5e9,stroke:#388e3c
    style P fill:#fff3e0,stroke:#f57c00
```

**关键要点：**

| 概念 | 为什么重要 |
|---------|----------------|
| **通信协议** | 与现有 PostgreSQL 工具兼容 |
| **消息框架** | 长度前缀二进制协议 |
| **简单 vs. 扩展** | 快速查询 vs. 预备语句 |
| **RowDescription** | 客户端的字段元数据 |
| **DataRow** | 实际行数据（文本或二进制） |
| **类型 OID** | PostgreSQL 类型识别 |
| **NULL 编码** | -1 长度前缀 |

---

**进一步阅读：**

- PostgreSQL Source: [`src/backend/tcop/postgres.c`](https://github.com/postgres/postgres/blob/master/src/backend/tcop/postgres.c)
- PostgreSQL Source: [`src/include/libpq/pqformat.h`](https://github.com/postgres/postgres/blob/master/src/include/libpq/pqformat.h)
- "PostgreSQL Wire Protocol" documentation: https://www.postgresql.org/docs/current/protocol.html
- libpq source: [`src/interfaces/libpq/`](https://github.com/postgres/postgres/tree/master/src/interfaces/libpq)
- Vaultgres Repository: [github.com/neoalienson/Vaultgres](https://github.com/neoalienson/Vaultgres)

