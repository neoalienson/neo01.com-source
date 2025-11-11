---
title: ASP.NET string.Format
id: 2636
date: 2008-08-29 18:38:31
lang: ja
---

{0:d} YY-MM-DD
{0:p} パーセンテージ00.00%
{0:N2} 12.68
{0:N0} 13
{0:c2} $12.68
{0:d} 3/23/2003
{0:T} 12:00:00 AM
{0:男;;女}

DataGrid-データ形式設定式

データ形式設定式
.NET Frameworkの形式設定式は、データが列に表示される前にデータに適用されます。この式は、オプションの静的テキストと次の形式で表される形式指定子で構成されます：
{0:format specifier}

ゼロはパラメータインデックスで、列内でフォーマットされるデータ要素を示します。したがって、通常はゼロを使用して最初の（そして唯一の）要素を示します。format specifierの前にはコロン（:）があり、データのフォーマット方法を示す1つ以上の文字で構成されます。使用できる形式指定子は、フォーマットするデータの種類（日付、数値、またはその他のタイプ）によって異なります。次の表は、さまざまなデータ型の形式設定式の例を示しています。形式設定式の詳細については、型のフォーマットを参照してください。

# Currency
{0:C}
numeric/decimal
「Price:」を表示し、その後に通貨形式で表される数値が続きます。通貨形式は、PageディレクティブまたはWeb.configファイルのculture属性を通じて指定されたカルチャ設定によって異なります。

# Integer
{0:D4}
整数（小数と一緒に使用できません。）
ゼロで埋められた4文字幅のフィールドに整数を表示します。

# Numeric
{0:N2}%
小数点以下2桁まで正確な数値を表示し、その後に「%」が続きます。

# Numeric/Decimal
{0:000.0}
小数点以下1桁に四捨五入された数値。3桁未満の数値はゼロで埋められます。

# Date/Datetime Long
{0:D}
長い日付形式（「Thursday, August 06, 1996」）。日付形式は、ページまたはWeb.configファイルのカルチャ設定によって異なります。

# Date/Datetime short
{0:d}
短い日付形式（「12/31/99」）。

# Date/Datetime customize
{0:yy-MM-dd}
数値の年-月-日で表される日付（96-08-06）。

2006-02-22 | asp.netデータ形式のFormat-- DataFormatString

データを表示する際、未加工のデータをユーザーに表示すべきではありません。例えば、1万円の金額を「10000」と直接表示すると、ユーザーが千または十万と見間違える可能性があり、データの読み取りに困難をもたらします。1万円を「NT$10,000」と装飾して出力すれば、読みやすくなるだけでなく、ユーザーのミスも減らせます。\n以下の画面は装飾後の結果です：
上記のデータは、DataGrid Webコントロールを色で区別するだけでなく、主に日付、単価、小計の3つのフィールドのデータをより読みやすく装飾しています。フィールドの出力を装飾するには、フィールドのDataFormatString属性を設定するだけです。その使用構文は次のとおりです：

DataFormatString=\"{0:形式文字列}\"

DataFormatStringの{0}はデータ自体を表し、コロンの後の形式文字列は、データを表示したい形式を表します。また、指定された形式記号の後に、小数点以下の表示桁数を指定できます。例えば、元のデータが「12.34」で、形式が{0:N1}に設定されている場合、出力は「12.3」になります。一般的に使用される数値形式は次の表のとおりです：\\n\\n形式文字列 データ 結果
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

一般的に使用される日付形式は次の表のとおりです：

形式 説明 出力形式
d 簡潔な日付形式 MM/dd/yyyy
D 詳細な日付形式 dddd, MMMM dd, yyyy
f 完全な形式（長い日付+短い時刻） dddd, MMMM dd, yyyy HH:mm
F 完全な日付時刻形式
（長い日付+長い時刻）
dddd, MMMM dd, yyyy HH:mm:ss
g 一般形式（短い日付+短い時刻） MM/dd/yyyy HH:mm
G 一般形式（短い日付+長い時刻） MM/dd/yyyy HH:mm:ss
m,M 月日形式 MMMM dd\\ns 適度な日付時刻形式 yyyy-MM-dd HH:mm:ss
t 簡潔な時刻形式 HH:mm\\nT 詳細な時刻形式 HH:mm:ss

string.format形式結果

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

説明：
String.Format
指定されたString内の各形式項目を、対応するオブジェクトの値のテキスト等価物に置き換えます。

例：
int iVisit = 100;
string szName = \"Jackfled\";
Response.Write(String.Format(\"あなたのアカウントは：{0}。{1}回訪問しました。\", szName, iVisit));
