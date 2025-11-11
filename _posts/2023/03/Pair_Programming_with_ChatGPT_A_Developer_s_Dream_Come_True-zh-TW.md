---
title: 與 ChatGPT 結對程式設計 - 開發者的夢想成真
date: 2023-03-30
tags:
  - terraform
  - AI
categories:
  - Development
lang: zh-TW
excerpt: ChatGPT 不是取代開發者，而是最佳結對夥伴！學習如何用魔法問題獲得更好的程式碼審查。
comments: true
---

![](/2023/03/Pair_Programming_with_ChatGPT_A_Developer_s_Dream_Come_True/pair_programming.png)

作為一名全端開發者，多年來我與許多人類進行過結對程式設計。然而，最近我有機會與 ChatGPT（由 OpenAI 訓練的大型語言模型）合作，這是一個改變遊戲規則的體驗。我發現 ChatGPT 並沒有取代我的角色，而是作為結對程式設計的夥伴，為我提供有價值的見解和觀點。讓我們深入了解它如何改變我的結對程式設計體驗！

## 人類與 ChatGPT：完美的協同作用
人類開發者與 ChatGPT 之間的合作關係相當獨特。以下是我的典型循環：

1. 需求收集：我們人類開發者提供特定功能或函式的需求。ChatGPT 編寫程式碼，我們人類進行審查。
2. 總結需求：我發現要求 ChatGPT 總結我的需求非常有用，因為我通常不會一次性提供所有需求。這有助於我檢查我們是否在同一頁面上。
3. 單元測試範本：ChatGPT 根據總結的需求生成單元測試範本。
4. 人類完成並精煉單元測試：我們人類開發者完成並精煉單元測試，並向 ChatGPT 提供回饋，精煉他們對任務的理解。

## 輪到 ChatGPT 審查我的程式碼
反過來，人類可以編寫程式並要求 ChatGPT 審查和總結程式碼。這個過程有助於識別潛在問題並確保程式碼符合所需的需求。然而，有時您可能需要稍微幫助 ChatGPT，而不是直接丟一段程式碼。例如，

### 嘗試 #1，簡單地要求審查
提示：

{% codeblock lang:hcl line_number:false %}
review following terraform code in main.tf.

resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}
{% endcodeblock %}

回應

> 您提供的程式碼建立了一個名為「some_resource」的資源，名稱為「resource_name」，並將「name」屬性設定為「some_name」。此外，它根據條件設定「value」屬性。如果「condition」變數為 true，則「value」設定為「aaa,bbb,ccc,${var.b}」。如果「condition」為 false，則「value」設定為「${var.a},aaa,bbb,ccc,${var.b}」。
>
> 假設變數「a」、「b」和「condition」已正確定義，程式碼看起來是有效且功能正常的。然而，重要的是確保資源類型及其屬性對於您的基礎設施需求是正確且正確配置的。此外，使用描述性名稱來命名資源和屬性是一個好習慣，以便更容易理解程式碼的目的。

以上聽起來毫無意義。讓我們稍微精煉一下我們的問題

### 嘗試 #2，告訴您想從程式碼審查中得到什麼

提示：

{% codeblock lang:hcl line_number:false %}
review following terraform code in main.tf. can you propose better coding?

resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}
{% endcodeblock %}

回應

> 程式碼在語法方面看起來不錯，但如果您正在尋找建議，這裡有一些：
> 
> 為您的資源使用有意義的名稱總是一個好主意，這樣您以後可以輕鬆識別它們。不要使用「some_resource」和「resource_name」，嘗試想出更具描述性的名稱。
> 
> 在 value 屬性中，通常最好避免對複雜表達式使用三元運算子，因為它們會使程式碼更難閱讀和理解。相反，考慮將表達式分成多行，或建立一個保存計算值的單獨變數。
> 
> 考慮僅在必要時使用插值語法（${...}）。在這種情況下，由於 var.a 和 var.b 已經是變數，您可以簡單地使用 + 運算子將它們與其他字串連接起來。
> 
> 以下是如何使用這些建議重構程式碼的範例：
>
> ```hcl
> resource "some_resource" "example" {
>   name  = "example_resource"
>   value = compute_value(var.a, var.b, condition)
> }
> 
> // Define a separate function to compute the value
> // This makes the code easier to read and understand
> // and allows for reuse if needed
> locals {
>   compute_value = (a, b, condition) => {
>     if condition {
>       "aaa,bbb,ccc," + b
>     } else {
>       a + ",aaa,bbb,ccc," + b
>     }
>   }
> }
> ```
> 此程式碼使用局部變數來定義一個單獨的函式，該函式根據輸入變數和條件標誌計算值。這使得程式碼更容易閱讀和理解，並且如果需要還允許重複使用。


使用神奇的問題*你能提出更好的編碼嗎？*您會得到更有意義的結果。儘管它無法發現我正在重複部分變數（`,aaa,bbb,ccc,${var.b}`），這違反了 DRY 原則。我稍微重寫了一下並再次詢問，如下所示，

### 嘗試 #3，詢問對我的兩段程式碼的意見

提示：

{% codeblock lang:hcl line_number:false %}
which terraform code is better, can you propose better coding?

code 1,
  resource "some_resource" "resource_name" {
  name = "some_name"
  value = condition == true ? "aaa,bbb,ccc,${var.b}" : "${var.a},aaa,bbb,ccc,${var.b}"
}

code2,
  locals {
    a = {
      "aaa",
      "bbb",
      "ccc",
      var.b,
    }
  }
  resource "some_resource" "resource_name" {
  name = "some_name"
  value = join(",", condition == true ? [] : var.a, local.a)
}
{% endcodeblock %}

回應

> 兩個程式碼範例都是有效且功能正常的，但它們有不同的目的和實作。
> 
> 程式碼 1 使用三元運算子根據條件設定「some_resource」資源的「value」屬性。這是設定屬性的簡潔方式，但對於更複雜的表達式可能可讀性較差。
> 
> 程式碼 2 使用局部變數來建立要連接在一起的值列表。它使用「join」函式將列表中的值與逗號作為分隔符連接起來。對於較長的值列表和表達式，這種方法可能更具可讀性。
> 
> 最終，這兩個程式碼範例之間的選擇取決於您的基礎設施的特定需求和要求。如果您有一個小的值列表和一個簡單的條件，程式碼 1 可能更合適。如果您有一個較長的值列表和一個更複雜的表達式，程式碼 2 可能更合適。
> 為了提出更好的編碼，我建議結合兩個程式碼範例的最佳部分，以建立更具可讀性、可維護性和可擴展性的程式碼。
> 
> ```hcl
> locals {
>   some_values = [
>     "aaa",
>     "bbb",
>     "ccc",
>     var.b,
>   ]
> }
> 
> resource "some_resource" "resource_name" {
>   name  = "some_name"
>   value = join(",", concat(var.a, condition ? [] : local.some_values))
> }
> ```
> 在此程式碼中，我們使用局部變數來儲存硬編碼值和「var.b」變數。然後，我們使用「concat」函式連接「var.a」和局部變數的值。最後，我們使用「join」函式將值與逗號分隔符連接起來。
> 
> 此程式碼比以前的範例更具可讀性、可維護性和可擴展性。它將硬編碼值與變數分開，使用更具可讀性的「concat」函式而不是三元運算子，並使用更簡潔的「join」函式。
> 

這結合了人類和 AI 的改進！然而，我最有可能使用嘗試 #2，因為它毫不費力。

## ChatGPT 在結對程式設計中的優勢
以下是在結對程式設計中使用 ChatGPT 而不是另一個人類的一些主要優勢：

1. 全天候可用性：ChatGPT 始終可用，讓您可以在靈感來襲時隨時處理專案，而無需等待其他開發者。
2. 即時回饋：即時接收有關您的程式碼的回饋，簡化您的開發流程。
3. 一致性：ChatGPT 提供一致的回饋品質，不受人類偏見或情緒波動的影響。
4. 多樣性：ChatGPT 可以提供人類結對程式設計師可能沒有的多樣化觀點和見解。這可以帶來更具創意和創新的解決方案。
6. 學習機會：透過觀察 ChatGPT 的建議和程式碼審查，開發者可以學習新的編碼技術和最佳實踐。

## 潛在缺點

如範例所示，您應該注意，如果您沒有提供足夠的背景或提出正確的問題，審查結果將不令人滿意。

## GitHub Copilot 與 Visual Studio Code
我發現它有助於程式碼完成，但目前缺乏互動性。

## 協作的新時代
與 ChatGPT 的結對程式設計是一個改變遊戲規則的體驗。它在人類開發者和 AI 之間提供了強大的協同作用，簡化了開發流程並提供了新的學習機會。雖然它永遠無法取代人類開發者的創造力和解決問題的能力，但 ChatGPT 是現代開發者工具庫中的寶貴工具。所以，試試看，親自體驗結對程式設計的未來！
