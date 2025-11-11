---
title: 使用 ChatGPT 繪製序列圖
date: 2023-05-10
tags:
  - AI
categories:
  - AI
lang: zh-TW
excerpt: 用 ChatGPT 和 Mermaid 輕鬆生成專業序列圖，將複雜系統互動轉化為清晰可視化文件。
comments: true
---

![](/2023/05/Using_ChatGPT_to_Draw_Sequence_Diagram/sequence_diagram.png)

要使用 ChatGPT 生成序列圖，您可以提供系統及其元件之間互動的描述。描述應以清晰簡潔的方式撰寫，使用簡單的語言和邏輯的事件順序。一旦您有了描述，就可以使用 [Mermaid](https://mermaid.js.org/) 等工具來建立圖表。

在以下使用 ChatGPT 3.5 Turbo 的範例中，我們描述了使用者使用其銀行的行動應用程式從 ATM 提款的過程。我們要求使用 Mermaid 語法生成序列圖。我們將提示精煉了大約 10 次以確保獲得最佳結果。

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

ChatGPT 生成給定提示的自然語言描述，這有助於檢閱提示是否清晰且模型可以理解。以下是 ChatGPT 生成的腳本。

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

> 在此圖表中，每個參與者都表示為一條垂直線。箭頭表示參與者之間的訊息流。
> 旅程從使用者在銀行應用程式中按下「從 ATM 提款」按鈕並輸入要提款的金額開始。然後使用者按下「開始提款」按鈕，這會啟動銀行應用程式中的相機。
> 然後使用者按下 ATM 上的按鈕以顯示行動提款 QR 碼。ATM 呼叫提款權杖 API 以請求行動提款權杖，該權杖儲存在資料庫中並發送回 ATM。
> ATM 從權杖生成 QR 碼並將其顯示在 ATM 螢幕上。銀行應用程式掃描 QR 碼並將權杖和提款金額發送到提款請求 API。
> 提款請求 API 檢查權杖是否存在於資料庫中以及是否已過期。如果權杖存在且未過期，提款請求 API 會使資料庫中的權杖失效，並使用交易 API 的權杖提交交易。交易 API 將交易狀態更新到資料庫。
> ATM 輪詢交易狀態 API 以檢查交易是否完成，交易狀態 API 從資料庫檢查交易狀態並將其返回給 ATM。一旦交易完成，ATM 就會向使用者提供現金。
> 最後，使用者從 ATM 取走現金，完成提款過程。如果權杖不存在或已過期，銀行應用程式會向使用者顯示無效的 QR 碼訊息。

以下是產生的序列圖。為了獲得最佳體驗，您應該在 [mermaid live editor](https://mermaid.live/edit#pako:eNqdVVtv2jAU_iuWX_owqLiUS_JQibXSxEOlrrSaNPFikkOxSOzMdgqs6n_fsZ0E0oRuayQk4pzvO9-5-pVGMgYaUg2_chAR3HL2rFi6FASfjCnDI54xYchXJrazLGt-eNKgmqezx7vm4Q9uNrFiu0e5BTG7n5-3eLBytGm1eVRMaBYZLts5bplhK6bhQ-TCMJNrh_d2Nozu9fWXIs6Q3CvQmlyUisgN0xuyVjK1sV2QVW6MPIediyw3hKUyR69yTSKLNZLsCrKPXaI2Zax56bvurTCvIWcY1AszgJ5SUIysDoQbDcm67gmVl148o_WiN3JHUrniCVQCyfcHYjvDwxFm0e_LF2JOkuSIMfacVDV5b24pytqEZGGkggJiGQjsM64OZ6CI7TrxCxCxR9WkuW_fQGDsmIRCvK9W09hmw6cBsDwfRn6S62ZropqIicobQ2W6kudefQfUYzri6wm52UC0JXxdwGHPtdEeWhq5NLTpeACTK3GKtLP8Kb9c-0pA_DnfxyKyBCfuJBaXEaQX0tRd_IvKuXhhCY9tdQudgsS1QT_PUl8YGLFMU44Ddjz2HXjSKfapw-pynjIv5YRCu41iB6qpq2i8tv2DjShxiFqY8KNli1x9Tr9HMs0SsH9bxVbUbXVu8eOmpKm5Vvh25WXpW7UV9H-RWA32_3G1TnK5ZfPqRmruPo45yDNn6k0g0VC0aSyh7E7sVyJVYxjerQTvfmH3J_f9WS2DFHcsey7SiUuBdigu5pTxGC_bV3u8pGYDKSxpiH9jprZLuhRvaMdyIxcHEdHQqBw6NHe9VlzM5SHEHBfonb-83R3eoXjH_ZSyMsFXGr7SPQ27_dH4MpiMekFvMh4GV-PhtEMPNOyPppfDwWQ6vhoG-BsM3zr0t2MYXAbjXr8_nUx6oyAYjkeDtz_Ia75i) 中檢視它。

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
