---
title: ASP.NET string.Format
id: 2636
date: 2008-08-29 18:38:31
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
---

{0:d} YY-MM-DD
{0:p} Percentage 00.00%
{0:N2} 12.68
{0:N0} 13
{0:c2} $12.68
{0:d} 3/23/2003
{0:T} 12:00:00 AM
{0:Male;;Female}

DataGrid - Data Format Setting Expressions

Data Format Setting Expressions
.NET Framework format setting expressions are applied to data before it is displayed in columns. This expression consists of optional static text and format specifiers represented in the following format:
{0:format specifier}

Zero is the parameter index that indicates the data element to be formatted in the column; therefore, zero is typically used to indicate the first (and only) element. The format specifier is preceded by a colon (:) and consists of one or more letters that indicate how to format the data. The format specifiers that can be used depend on the data type to be formatted: dates, numbers, or other types. The following table shows examples of format setting expressions for different data types. For more information about format setting expressions, see Formatting Types.

# Currency
{0:C}
numeric/decimal
Displays "Price:" followed by a number in currency format. The currency format depends on the culture settings specified through the Page directive or the culture attribute in the Web.config file.

# Integer
{0:D4}
Integer (cannot be used with decimals).
Displays an integer in a four-character-wide field padded with zeros.

# Numeric
{0:N2}%
Displays a number accurate to two decimal places, followed by "%".

# Numeric/Decimal
{0:000.0}
Number rounded to one decimal place. Numbers with fewer than three digits are padded with zeros.

# Date/Datetime Long
{0:D}
Long date format ("Thursday, August 06, 1996"). The date format depends on the culture settings of the page or Web.config file.

# Date/Datetime short
{0:d}
Short date format ("12/31/99").

# Date/Datetime customize
{0:yy-MM-dd}
Date represented in numeric year-month-day format (96-08-06).

2006-02-22 | ASP.NET Data Format -- DataFormatString

When presenting data, we should not display unformatted data to users. For example, for an amount of ten thousand dollars, if we directly display "10000", it might cause users to read it as one thousand or one hundred thousand, creating confusion when reading the data. If we format ten thousand dollars and output it as "$10,000", it not only makes it easier for users to read but also reduces the chance of user errors.

The above data, in addition to using colors to separate records in the DataGrid Web control, mainly formats the date, unit price, and subtotal fields to make them easier to read. To format field output, you only need to set the field's DataFormatString property; its syntax is as follows:

DataFormatString="{0:format string}"

We know that {0} in DataFormatString represents the data itself, and the format string after the colon represents the format we want the data to display in; additionally, after specifying the format symbol, you can specify the number of decimal places to display. For example, if the original data is "12.34" and the format is set to {0:N1}, the output will be "12.3". Common numeric formats are shown in the table below:

Format String | Data | Result
"{0:C}" | 12345.6789 | $12,345.68
"{0:C}" | -12345.6789 | ($12,345.68)
"{0:D}" | 12345 | 12345
"{0:D8}" | 12345 | 00012345
"{0:E}" | 12345.6789 | 1234568E+004
"{0:E10}" | 12345.6789 | 1.2345678900E+004
"{0:F}" | 12345.6789 | 12345.68
"{0:F0}" | 12345.6789 | 12346
"{0:G}" | 12345.6789 | 12345.6789
"{0:G7}" | 123456789 | 1.234568E8
"{0:N}" | 12345.6789 | 12,345.68
"{0:N4}" | 123456789 | 123,456,789.0000
"Total: {0:C}" | 12345.6789 | Total: $12345.68

Common date formats are shown in the table below:

Format | Description | Output Format
d | Short date format | MM/dd/yyyy
D | Long date format | dddd, MMMM dd, yyyy
f | Full format (long date + short time) | dddd, MMMM dd, yyyy HH:mm
F | Full date time format (long date + long time) | dddd, MMMM dd, yyyy HH:mm:ss
g | General format (short date + short time) | MM/dd/yyyy HH:mm
G | General format (short date + long time) | MM/dd/yyyy HH:mm:ss
m,M | Month day format | MMMM dd
s | Sortable date time format | yyyy-MM-dd HH:mm:ss
t | Short time format | HH:mm
T | Long time format | HH:mm:ss

String.Format Results

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

Description:
String.Format
Replaces each format item in a specified String with the text equivalent of the value of a corresponding object.

Example:
int iVisit = 100;
string szName = "Jackfled";
Response.Write(String.Format("Your account is: {0}. Visited {1} times.", szName, iVisit));