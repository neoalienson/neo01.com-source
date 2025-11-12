---
title: ASP.NET string.Format
id: 2636
date: 2008-08-29 18:38:31
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: zh-CN
---

{0:d} YY-MM-DD
{0:p} 百分比00.00%
{0:N2} 12.68
{0:N0} 13
{0:c2} $12.68
{0:d} 3/23/2003
{0:T} 12:00:00 AM
{0:男;;女}

DataGrid-数据格式设置表达式

数据格式设置表达式
.NET Framework 格式设置表达式，它在数据显示在列中之前先应用于数据。此表达式由可选静态文本和用以下格式表示的格式说明符组成：
{0:format specifier}

零是参数索引，它指示列中要格式化的数据元素；因此，通常用零来指示第一个（且唯一的）元素。format specifier 前面有一个冒号 (:)，它由一个或多个字母组成，指示如何格式化数据。可以使用的格式说明符取决于要格式化的数据类型：日期、数字或其他类型。下表显示了不同数据类型的格式设置表达式的示例。有关格式设置表达式的更多信息，请参见格式化类型。

# Currency
{0:C}
numeric/decimal
显示"Price:"，后跟以货币格式表示的数字。货币格式取决于通过 Page 指令或 Web.config 文件中的区域性属性指定的区域性设置。

# Integer
{0:D4}
整数()不能和小数一起使用。
在由零填充的四个字符宽的字段中显示整数。

# Numeric
{0:N2}%
显示精确到小数点后两位的数字，后跟"%"。

# Numeric/Decimal
{0:000.0}
四舍五入到小数点后一位的数字。不到三位的数字用零填充。

# Date/Datetime Long
{0:D}
长日期格式（"Thursday, August 06, 1996"）。日期格式取决于页或 Web.config 文件的区域性设置。

# Date/Datetime short
{0:d}
短日期格式（"12/31/99"）。

# Date/Datetime customize
{0:yy-MM-dd}
用数字的年－月－日表示的日期（96-08-06）。

2006-02-22 | asp.net数据格式的Format-- DataFormatString

我们在呈现数据的时候，不要将未经修饰过的数据呈现给使用者。例如金额一万元，如果我们直接显示「10000」，可能会导致使用者看成一千或十万，造成使用者阅读数据上的困扰。若我们将一万元润饰后输出为「NT$10,000」，不但让使比较好阅读，也会让使用者减少犯错的机会。\n下列画面为润饰过的结果：
上述数据除了将DataGrid Web 控件以颜色来区隔记录外，最主要将日期、单价以及小计这三个计字段的数据修饰的更容易阅读。要修饰字段的输出，只要设置字段的DataFormatString 属性即可；其使用语法如下：

DataFormatString=\"{0:格式字符串}\"

我们知道在DataFormatString 中的 {0} 表示数据本身，而在冒号后面的格式字符串代表所们希望数据显示的格式；另外在指定的格式符号后可以指定小数所要显示的位数。例如原来的数据为「12.34」，若格式设置为 {0:N1}，则输出为「12.3」。其常用的数值格式如下表所示：\\n\\n格式字符串 数据 结果
\"{0:C}\" 12345.6789 $12,345.68
\"{0:C}\" -12345.6789 ($12,345.68)
\"{0:D}\" 12345 12345
\"{0:D8}\" 12345 00012345
\"{0:E}\" 12345.6789 1234568E+004
\"{0:E10}\" 12345.6789 1.2345678900E+004
\"{0:F}\" 12345.6789 12345.68
\"{0:F0}\" 12345.6789 12346
\"{0:G}\" 12345.6789 12345.6789
\"{0:G7}\" 123456789 1.234568E8
\"{0:N}\" 12345.6789 12,345.68
\"{0:N4}\" 123456789 123,456,789.0000
\"Total: {0:C}\" 12345.6789 Total: $12345.68

其常用的日期格式如下表所示：

格式 说明 输出格式
d 精简日期格式 MM/dd/yyyy
D 详细日期格式 dddd, MMMM dd, yyyy
f 完整格式 (long date + short time) dddd, MMMM dd, yyyy HH:mm
F 完整日期时间格式
(long date + long time)
dddd, MMMM dd, yyyy HH:mm:ss
g 一般格式 (short date + short time) MM/dd/yyyy HH:mm
G 一般格式 (short date + long time) MM/dd/yyyy HH:mm:ss
m,M 月日格式 MMMM dd\\ns 适中日期时间格式 yyyy-MM-dd HH:mm:ss
t 精简时间格式 HH:mm\\nT 详细时间格式 HH:mm:ss

string.format格式结果

String.Format

(C) Currency: . . . . . . . . ($123.00)

(D) Decimal:. . . . . . . . . -123

(E) Scientific: . . . . . . . -1.234500E+002

(F) Fixed point:. . . . . . . -123.45

(G) General:. . . . . . . . . -123

(N) Number: . . . . . . . . . -123.00

(P) Percent:. . . . . . . . . -12,345.00 %

(R) Round-trip: . . . . . . . -123.45

(X) Hexadecimal:. . . . . . . FFFFFF85

(d) Short date: . . . . . . . 6/26/2004

(D) Long date:. . . . . . . . Saturday, June 26, 2004

(t) Short time: . . . . . . . 8:11 PM

(T) Long time:. . . . . . . . 8:11:04 PM

(f) Full date/short time: . . Saturday, June 26, 2004 8:11 PM

(F) Full date/long time:. . . Saturday, June 26, 2004 8:11:04 PM

(g) General date/short time:. 6/26/2004 8:11 PM

(G) General date/long time: . 6/26/2004 8:11:04 PM

(M) Month:. . . . . . . . . . June 26

(R) RFC1123:. . . . . . . . . Sat, 26 Jun 2004 20:11:04 GMT

(s) Sortable: . . . . . . . . 2004-06-26T20:11:04

(u) Universal sortable: . . . 2004-06-26 20:11:04Z (invariant)

(U) Universal sortable: . . . Sunday, June 27, 2004 3:11:04 AM

(Y) Year: . . . . . . . . . . June, 2004

(G) General:. . . . . . . . . Green

(F) Flags:. . . . . . . . . . Green (flags or integer)

(D) Decimal number: . . . . . 3

(X) Hexadecimal:. . . . . . . 00000003

说明：
String.Format
将指定的 String 中的每个格式项替换为相应对象的值的文本等效项。

例子：
int iVisit = 100;
string szName = \"Jackfled\";
Response.Write(String.Format(\"您的帐号是：{0} 。访问了 {1} 次.\", szName, iVisit));
