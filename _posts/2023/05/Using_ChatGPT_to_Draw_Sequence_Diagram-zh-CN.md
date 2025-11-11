---
title: 使用 ChatGPT 绘制序列图
date: 2023-05-10
tags:
  - AI
categories:
  - AI
lang: zh-CN
excerpt: 用 ChatGPT 和 Mermaid 轻松生成专业序列图，将复杂系统交互转化为清晰可视化文档。
comments: true
---

![](/2023/05/Using_ChatGPT_to_Draw_Sequence_Diagram/sequence_diagram.png)

要使用 ChatGPT 生成序列图，您可以提供系统及其组件之间交互的描述。描述应以清晰简洁的方式撰写，使用简单的语言和逻辑的事件顺序。一旦您有了描述，就可以使用 [Mermaid](https://mermaid.js.org/) 等工具来创建图表。

在以下使用 ChatGPT 3.5 Turbo 的示例中，我们描述了用户使用其银行的移动应用程序从 ATM 取款的过程。我们要求使用 Mermaid 语法生成序列图。我们将提示精炼了大约 10 次以确保获得最佳结果。

> write mermaid to generate sequence diagram for a journey of a user to withdraw cash from atm by using his bank mobile app.
> user presses "withdraw cash from atm" button from bank app,
> user inputs the amount of cash to withdraw
> user presses "start to withdraw" button from bank app,
> the bank app activates the camera by itself and is ready to scan a QR code
> the user presses a button on the ATM to show the mobile cash withdrawal QR code
> the atm calls withdraw token API to request a mobile withdraw token
> the withdraw token API generates a token with expiry, stores it into database, and then sends the token back to the atm
> the atm generates the QR code from the token, and then presents the QR code on atm screen
> the bank app scans the QR code and sends the token and withdraw amount to withdraw request api
> the withdraw request api checks if the token exists in the database. bank app shows invalid QR code if it does not exist.
> the withdraw request api checks if the token expired. bank app shows invalid QR code if it is expired.
> if the token exists and is not expired, the withdraw request api invalidates the token from database, and then commits the transaction with the token from transaction api. the transaction updates transaction status to database
> the atm polls "transaction status api" to check if the transaction with the token has been completed. "transaction status api" checks status from database and replies status to ATM. once completed, presents cash to user.
> the user picks up cash from atm

ChatGPT 生成给定提示的自然语言描述，这有助于检阅提示是否清晰且模型可以理解。以下是 ChatGPT 生成的脚本。

{% codeblock lang:mermaid line_number:false %}
  sequenceDiagram
    participant BankApp
    participant User
    participant ATM
    participant WithdrawTokenAPI
    participant WithdrawRequestAPI
    participant TransactionAPI
    participant Database
    participant TransactionStatusAPI

    User->>+BankApp: Press 'Withdraw Cash from ATM' button
    User->>+BankApp: Input amount of cash to withdraw
    User->>+BankApp: Press 'Start to Withdraw' button
    BankApp->>+BankApp: Activate camera by itself
    User->>+ATM: Press button to show mobile withdraw QR code
    ATM->>+WithdrawTokenAPI: Call withdraw token API
    WithdrawTokenAPI->>+Database: Store token with expiry
    WithdrawTokenAPI-->>-ATM: Send token
    ATM->>+ATM: Generate QR code from token
    ATM->>+User: Present mobile withdraw QR code
    BankApp->>+WithdrawRequestAPI: Scan QR code and send token and amount
    WithdrawRequestAPI->>+Database: Check if token exists
    Database-->>-WithdrawRequestAPI: Return token existence
    WithdrawRequestAPI->>+Database: Check if token is expired
    Database-->>-WithdrawRequestAPI: Return token expiry
    alt Token exists and is not expired
        WithdrawRequestAPI->>+Database: Invalidate token in database
        WithdrawRequestAPI->>+TransactionAPI: Commit transaction with token
        TransactionAPI->>+Database: Update transaction status to database
        ATM->>+TransactionStatusAPI: Poll transaction status API to check transaction completion
        TransactionStatusAPI->>+Database: Check transaction status from database
        Database-->>-TransactionStatusAPI: Return transaction completion status
        TransactionStatusAPI-->>-ATM: Return transaction completion status
        ATM->>+User: Present cash to user
        User->>+ATM: Pick up cash
    else Token does not exist or is expired
        BankApp->>+User: Show invalid QR code message
    end
{% endcodeblock %}

> 在此图表中，每个参与者都表示为一条垂直线。箭头表示参与者之间的消息流。
> 旅程从用户在银行应用程序中按下"从 ATM 取款"按钮并输入要取款的金额开始。然后用户按下"开始取款"按钮，这会启动银行应用程序中的相机。
> 然后用户按下 ATM 上的按钮以显示移动取款 QR 码。ATM 调用取款令牌 API 以请求移动取款令牌，该令牌存储在数据库中并发送回 ATM。
> ATM 从令牌生成 QR 码并将其显示在 ATM 屏幕上。银行应用程序扫描 QR 码并将令牌和取款金额发送到取款请求 API。
> 取款请求 API 检查令牌是否存在于数据库中以及是否已过期。如果令牌存在且未过期，取款请求 API 会使数据库中的令牌失效，并使用交易 API 的令牌提交交易。交易 API 将交易状态更新到数据库。
> ATM 轮询交易状态 API 以检查交易是否完成，交易状态 API 从数据库检查交易状态并将其返回给 ATM。一旦交易完成，ATM 就会向用户提供现金。
> 最后，用户从 ATM 取走现金，完成取款过程。如果令牌不存在或已过期，银行应用程序会向用户显示无效的 QR 码消息。

以下是产生的序列图。为了获得最佳体验，您应该在 [mermaid live editor](https://mermaid.live/edit#pako:eNqdVVtv2jAU_iuWX_owqLiUS_JQibXSxEOlrrSaNPFikkOxSOzMdgqs6n_fsZ0E0oRuayQk4pzvO9-5-pVGMgYaUg2_chAR3HL2rFi6FASfjCnDI54xYchXJrazLGt-eNKgmqezx7vm4Q9uNrFiu0e5BTG7n5-3eLBytGm1eVRMaBYZLts5bplhK6bhQ-TCMJNrh_d2Nozu9fWXIs6Q3CvQmlyUisgN0xuyVjK1sV2QVW6MPIediyw3hKUyR69yTSKLNZLsCrKPXaI2Zax56bvurTCvIWcY1AszgJ5SUIysDoQbDcm67gmVl148o_WiN3JHUrniCVQCyfcHYjvDwxFm0e_LF2JOkuSIMfacVDV5b24pytqEZGGkggJiGQjsM64OZ6CI7TrxCxCxR9WkuW_fQGDsmIRCvK9W09hmw6cBsDwfRn6S62ZropqIicobQ2W6kudefQfUYzri6wm52UC0JXxdwGHPtdEeWhq5NLTpeACTK3GKtLP8Kb9c-0pA_DnfxyKyBCfuJBaXEaQX0tRd_IvKuXhhCY9tdQudgsS1QT_PUl8YGLFMU44Ddjz2HXjSKfapw-pynjIv5YRCu41iB6qpq2i8tv2DjShxiFqY8KNli1x9Tr9HMs0SsH9bxVbUbXVu8eOmpKm5Vvh25WXpW7UV9H-RWA32_3G1TnK5ZfPqRmruPo45yDNn6k0g0VC0aSyh7E7sVyJVYxjerQTvfmH3J_f9WS2DFHcsey7SiUuBdigu5pTxGC_bV3u8pGYDKSxpiH9jprZLuhRvaMdyIxcHEdHQqBw6NHe9VlzM5SHEHBfonb-83R3eoXjH_ZSyMsFXGr7SPQ27_dH4MpiMekFvMh4GV-PhtEMPNOyPppfDwWQ6vhoG-BsM3zr0t2MYXAbjXr8_nUx6oyAYjkeDtz_Ia75i) 中查看它。

{% mermaid %}
  sequenceDiagram
    participant BankApp
    participant User
    participant ATM
    participant WithdrawTokenAPI
    participant WithdrawRequestAPI
    participant TransactionAPI
    participant Database
    participant TransactionStatusAPI

    User->>+BankApp: Press 'Withdraw Cash from ATM' button
    User->>+BankApp: Input amount of cash to withdraw
    User->>+BankApp: Press 'Start to Withdraw' button
    BankApp->>+BankApp: Activate camera by itself
    User->>+ATM: Press button to show mobile withdraw QR code
    ATM->>+WithdrawTokenAPI: Call withdraw token API
    WithdrawTokenAPI->>+Database: Store token with expiry
    WithdrawTokenAPI-->>-ATM: Send token
    ATM->>+ATM: Generate QR code from token
    ATM->>+User: Present mobile withdraw QR code
    BankApp->>+WithdrawRequestAPI: Scan QR code and send token and amount
    WithdrawRequestAPI->>+Database: Check if token exists
    Database-->>-WithdrawRequestAPI: Return token existence
    WithdrawRequestAPI->>+Database: Check if token is expired
    Database-->>-WithdrawRequestAPI: Return token expiry
    alt Token exists and is not expired
        WithdrawRequestAPI->>+Database: Invalidate token in database
        WithdrawRequestAPI->>+TransactionAPI: Commit transaction with token
        TransactionAPI->>+Database: Update transaction status to database
        ATM->>+TransactionStatusAPI: Poll transaction status API to check transaction completion
        TransactionStatusAPI->>+Database: Check transaction status from database
        Database-->>-TransactionStatusAPI: Return transaction completion status
        TransactionStatusAPI-->>-ATM: Return transaction completion status
        ATM->>+User: Present cash to user
        User->>+ATM: Pick up cash
    else Token does not exist or is expired
        BankApp->>+User: Show invalid QR code message
    end
{% endmermaid %}
