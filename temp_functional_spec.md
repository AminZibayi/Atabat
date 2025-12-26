The problem: the orignal atabat site is using old tech and has an bad UX we want to create a new website with same functionality but with much newer tech and better user experience the website interacts with original https://atabatorg.haj.ir/ under the hood.
The App has the following requirements:
An scraper engine using playwright that connects to https://atabatorg.haj.ir/ website which is written in asp.net webforms and lacks APIs and performs the actions below
Authorization:
on page https://atabatorg.haj.ir/login > enter username and password of "Kargozar", reads captcha and enter the captcha, clicks submit; in the new field that appeared enter OTP which is already saved in database field. then the auth cookies are saved a file and are used in the next actions until they expire, if they expire the method is reperformed to gain fresh and valid cookies

**Note:** OTP is refreshed everyday at 12 AM, so the number is valid for a day and is manually entered in admin panel at 12 AM everyday

on page https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx there is a table to list the trips > turn it into a get request with the table search field as queryParameters. the query is performed and the output table that is shown on the website will be parsed to json and delivered to the client.

```
<table class="Atabat" style="width: 1000px" cellspacing="0">
        <tbody><tr class="header">
            <td style="height: 16px" colspan="4">
                محدوده زمانی
            </td>
            <td colspan="4" style="height: 16px">
                ظرفیت درخواستی
            </td>
            <td style="width: 108px; height: 16px">
                کد کارگزار
            </td>
            <td style="width: 117px; height: 16px">
                محل اعزام
            </td>
            <td style="width: 117px; height: 16px">
                <span id="ctl00_cp1_lblBorderType">نوع اعزام</span>
            </td>

        </tr>
        <tr>
            <td style="width: 59px; text-align: left; height: 30px;">
                از تاریخ:
            </td>
            <td style="width: 102px; height: 30px; text-align: right;">
                <div id="bd-root-txtDateFrom" style="position: relative;"><input name="txtDateFrom" id="txtDateFrom" dir="ltr" readonly="readOnly" style="width: 70px" placeholder=""><div id="bd-main-txtDateFrom" class="bd-main bd-hide" style="position: absolute; direction: rtl;"><div class="bd-calendar"><div class="bd-title"><button id="bd-prev-txtDateFrom" class="bd-prev" type="button" title="ماه قبلی" data-toggle="tooltip" style="background-image: url(&quot;../js/kamadatepicker/timeir_next.png&quot;);"><span style="display: none;">قبلی</span></button><div class="bd-dropdown"><select id="bd-month-txtDateFrom" class="bd-month"><option value="1">فروردین</option><option value="2">اردیبهشت</option><option value="3">خرداد</option><option value="4">تیر</option><option value="5">مرداد</option><option value="6">شهریور</option><option value="7">مهر</option><option value="8">آبان</option><option value="9">آذر</option><option value="10">دی</option><option value="11">بهمن</option><option value="12">اسفند</option></select></div><div class="bd-dropdown"><select id="bd-year-txtDateFrom" class="bd-year"><option value="1399">١٣٩٩</option><option value="1400">١۴٠٠</option><option value="1401">١۴٠١</option><option value="1402">١۴٠٢</option><option value="1403">١۴٠٣</option><option value="1404">١۴٠۴</option><option value="1405">١۴٠۵</option><option value="1406">١۴٠۶</option></select></div><button id="bd-next-txtDateFrom" class="bd-next" type="button" title="ماه بعدی" data-toggle="tooltip" style="background-image: url(&quot;../js/kamadatepicker/timeir_prev.png&quot;);"><span style="display: none;">بعدی</span></button></div><table class="bd-table" dir="rtl" cellspacing="0" cellpadding="0"><thead><tr><th>ش</th><th>ی</th><th>د</th><th>س</th><th>چ</th><th>پ</th><th>ج</th></tr></thead><tbody id="bd-table-days-txtDateFrom" class="bd-table-days"><tr class="tr-1"><td><button class="day day-1" type="button">١</button></td><td><button class="day day-2" type="button">٢</button></td><td><button class="day day-3" type="button">٣</button></td><td><button class="day day-4" type="button">۴</button></td><td><button class="day day-5" type="button">۵</button></td><td><button class="day day-6" type="button">۶</button></td><td><button class=" bd-holiday day day-7" type="button">٧</button></td></tr><tr class="tr-2"><td><button class="day day-8" type="button">٨</button></td><td><button class="day day-9" type="button">٩</button></td><td><button class="day day-10" type="button">١٠</button></td><td><button class="day day-11" type="button">١١</button></td><td><button class="day day-12" type="button">١٢</button></td><td><button class="day day-13" type="button">١٣</button></td><td><button class=" bd-holiday day day-14" type="button">١۴</button></td></tr><tr class="tr-3"><td><button class="day day-15" type="button">١۵</button></td><td><button class="day day-16" type="button">١۶</button></td><td><button class="day day-17" type="button">١٧</button></td><td><button class="day day-18" type="button">١٨</button></td><td><button class="day day-19" type="button">١٩</button></td><td><button class="day day-20" type="button">٢٠</button></td><td><button class=" bd-holiday day day-21" type="button">٢١</button></td></tr><tr class="tr-4"><td><button class="day day-22" type="button">٢٢</button></td><td><button class="day day-23" type="button">٢٣</button></td><td><button class="day day-24" type="button">٢۴</button></td><td><button class="day day-25" type="button">٢۵</button></td><td><button class=" bd-today day day-26" type="button">٢۶</button></td><td><button class="day day-27" type="button">٢٧</button></td><td><button class=" bd-holiday day day-28" type="button">٢٨</button></td></tr><tr class="tr-5"><td><button class="day day-29" type="button">٢٩</button></td><td><button class="day day-30" type="button">٣٠</button></td></tr></tbody></table><div class="bd-goto-today">برو به امروز</div></div></div></div>
            </td>
            <td style="width: 49px; text-align: left; height: 30px;">
                تا تاریخ:
            </td>
            <td style="border-left: darkseagreen 1px solid; width: 106px; height: 30px; text-align: right;">
                <div id="bd-root-txtDateto" style="position: relative;"><input name="txtDateto" id="txtDateto" dir="ltr" readonly="readOnly" style="width: 70px" placeholder=""><div id="bd-main-txtDateto" class="bd-main bd-hide" style="position: absolute; direction: rtl;"><div class="bd-calendar"><div class="bd-title"><button id="bd-prev-txtDateto" class="bd-prev" type="button" title="ماه قبلی" data-toggle="tooltip" style="background-image: url(&quot;../js/kamadatepicker/timeir_next.png&quot;);"><span style="display: none;">قبلی</span></button><div class="bd-dropdown"><select id="bd-month-txtDateto" class="bd-month"><option value="1">فروردین</option><option value="2">اردیبهشت</option><option value="3">خرداد</option><option value="4">تیر</option><option value="5">مرداد</option><option value="6">شهریور</option><option value="7">مهر</option><option value="8">آبان</option><option value="9">آذر</option><option value="10">دی</option><option value="11">بهمن</option><option value="12">اسفند</option></select></div><div class="bd-dropdown"><select id="bd-year-txtDateto" class="bd-year"><option value="1399">١٣٩٩</option><option value="1400">١۴٠٠</option><option value="1401">١۴٠١</option><option value="1402">١۴٠٢</option><option value="1403">١۴٠٣</option><option value="1404">١۴٠۴</option><option value="1405">١۴٠۵</option><option value="1406">١۴٠۶</option></select></div><button id="bd-next-txtDateto" class="bd-next" type="button" title="ماه بعدی" data-toggle="tooltip" style="background-image: url(&quot;../js/kamadatepicker/timeir_prev.png&quot;);"><span style="display: none;">بعدی</span></button></div><table class="bd-table" dir="rtl" cellspacing="0" cellpadding="0"><thead><tr><th>ش</th><th>ی</th><th>د</th><th>س</th><th>چ</th><th>پ</th><th>ج</th></tr></thead><tbody id="bd-table-days-txtDateto" class="bd-table-days"><tr class="tr-1"><td><button class="day day-1" type="button">١</button></td><td><button class="day day-2" type="button">٢</button></td><td><button class="day day-3" type="button">٣</button></td><td><button class="day day-4" type="button">۴</button></td><td><button class="day day-5" type="button">۵</button></td><td><button class="day day-6" type="button">۶</button></td><td><button class=" bd-holiday day day-7" type="button">٧</button></td></tr><tr class="tr-2"><td><button class="day day-8" type="button">٨</button></td><td><button class="day day-9" type="button">٩</button></td><td><button class="day day-10" type="button">١٠</button></td><td><button class="day day-11" type="button">١١</button></td><td><button class="day day-12" type="button">١٢</button></td><td><button class="day day-13" type="button">١٣</button></td><td><button class=" bd-holiday day day-14" type="button">١۴</button></td></tr><tr class="tr-3"><td><button class="day day-15" type="button">١۵</button></td><td><button class="day day-16" type="button">١۶</button></td><td><button class="day day-17" type="button">١٧</button></td><td><button class="day day-18" type="button">١٨</button></td><td><button class="day day-19" type="button">١٩</button></td><td><button class="day day-20" type="button">٢٠</button></td><td><button class=" bd-holiday day day-21" type="button">٢١</button></td></tr><tr class="tr-4"><td><button class="day day-22" type="button">٢٢</button></td><td><button class="day day-23" type="button">٢٣</button></td><td><button class="day day-24" type="button">٢۴</button></td><td><button class="day day-25" type="button">٢۵</button></td><td><button class=" bd-today day day-26" type="button">٢۶</button></td><td><button class="day day-27" type="button">٢٧</button></td><td><button class=" bd-holiday day day-28" type="button">٢٨</button></td></tr><tr class="tr-5"><td><button class="day day-29" type="button">٢٩</button></td><td><button class="day day-30" type="button">٣٠</button></td></tr></tbody></table><div class="bd-goto-today">برو به امروز</div></div></div></div>
            </td>
            <td style="width: 57px; text-align: left; height: 30px;">
                بزرگسال:
            </td>
            <td style="width: 46px; height: 30px; text-align: right;">
                <select name="ctl00$cp1$cmbCount" id="ctl00_cp1_cmbCount" style="font-family:Tahoma;font-size:9pt;font-weight:normal;width:40px;">
	<option selected="selected" value="1">1</option>
	<option value="2">2</option>
	<option value="3">3</option>
	<option value="4">4</option>
	<option value="5">5</option>
	<option value="6">6</option>
	<option value="7">7</option>
	<option value="8">8</option>
	<option value="9">9</option>
	<option value="10">10</option>
	<option value="11">11</option>
	<option value="12">12</option>

	</select>
            </td>
            <td style="width: 81px; text-align: left; height: 30px;">
                زیر 2 سال:
            </td>
            <td style="width: 71px; border-left: darkseagreen 1px solid; height: 30px; text-align: right;">
                <select name="ctl00$cp1$cmbUnder2Year" id="ctl00_cp1_cmbUnder2Year" style="font-family:Tahoma;font-size:9pt;font-weight:normal;width:40px;">
	<option selected="selected" value="0">0</option>
	<option value="1">1</option>
	<option value="2">2</option>

	</select>
            </td>
            <td style="width: 108px; height:30px;">
                <input name="ctl00$cp1$txtKargozarNo" type="text" maxlength="5" id="ctl00_cp1_txtKargozarNo" dir="ltr" vdir="middle" style="border-color:DarkSeaGreen;border-width:1px;border-style:Solid;font-family:Tahoma;font-size:9pt;height:20px;width:60px;">
                <span id="ctl00_cp1_rg1" style="color:Red;visibility:hidden;"><img src="image\error.gif"></span>
            </td>
            <td style="width: 117px; height: 30px;">
                <select name="ctl00$cp1$cmbProvince" id="ctl00_cp1_cmbProvince" style="font-family:Tahoma;font-size:9pt;height:20px;width:100px;">
	<option value="10">اردبيل</option>
	<option value="11">آذربايجان شرقي</option>
	<option value="12">آذربايجان غربي</option>
	<option value="13">اصفهان</option>
	<option value="14">ايلام</option>
	<option value="15">كرمانشاه</option>
	<option value="16">بوشهر</option>
	<option selected="selected" value="17">تهران</option>
	<option value="18">چهار محال و بختياري</option>
	<option value="19">خراسان رضوی</option>
	<option value="20">خوزستان</option>
	<option value="21">زنجان</option>
	<option value="22">سمنان</option>
	<option value="23">سیستان و بلوچستان</option>
	<option value="24">فارس</option>
	<option value="25">كردستان</option>
	<option value="26">كرمان</option>
	<option value="27">كهكيلويه و بوير احمد</option>
	<option value="28">گيلان</option>
	<option value="29">لرستان</option>
	<option value="30">مازندران</option>
	<option value="31">مركزي</option>
	<option value="32">هرمزگان</option>
	<option value="33">همدان</option>
	<option value="34">يزد</option>
	<option value="35">قم</option>
	<option value="36">كاشان</option>
	<option value="37">قزوين</option>
	<option value="38">گلستان</option>
	<option value="39">خراسان جنوبي</option>
	<option value="40">خراسان شمالي</option>
	<option value="47">البرز</option>
	<option value="-1">کلیه استانها</option>

	</select>
            </td>
            <td style="width: 117px; height: 30px;">
                <select name="ctl00$cp1$cmbBorder" id="ctl00_cp1_cmbBorder" style="font-family:Tahoma;font-size:9pt;width:100px;">
	<option selected="selected" value="1000">---</option>
	<option value="2">بسته زیارت هوایی</option>
	<option value="1">بسته زیارت زمینی</option>
	<option value="128">فقط اسکان</option>
	<option value="129">فقط پرواز</option>

	</select>
            </td>
        </tr>

    </tbody>
</table>
```

Data:

```
<table cellspacing="0" rules="all" dir="rtl" border="1" id="ctl00_cp1_grdKargroup" style="font-family:Tahoma;font-size:9pt;width:850px;border-collapse:collapse;">
		<tbody><tr style="color:Black;background-color:DarkSeaGreen;height:20px;">
			<th scope="col">روز</th><th scope="col">تاریخ اعزام</th><th scope="col">ظرفیت مانده</th><th scope="col">نوع</th><th scope="col">هزینه</th><th scope="col">محل اعزام	</th><th scope="col">شهر</th><th scope="col">نام کارگزار</th><th scope="col">گروه</th><th scope="col">نام شرکت مجری</th><th scope="col">هتل نجف</th><th scope="col">هتل کربلا</th><th scope="col">هتل کاظمین</th><th scope="col">آدرس</th><th scope="col">&nbsp;</th>
		</tr><tr style="background-color:White;height:30px;">
			<td>جمعه</td><td>04/09/28</td><td>2</td><td style="background-color:DarkSeaGreen;">هوايي7شب امام خمینی نجف Iran/ کربلا3 سامرا عبوري/کاظمين1/نجف3                                                                                                                                           </td><td>
                        <span id="ctl00_cp1_grdKargroup_ctl02_Label1">341,364,792</span>
                    </td><td>تهران</td><td style="width:80px;">تهران</td><td>دریای کرم حسین(ع)</td><td style="width:50px;">3267</td><td>دریای کرم حسین(ع)</td><td>مدینه البشری(سلف سرویس)(1ج)</td><td>برج المرتضی(1ج)</td><td>کاظمین-هتل نامشخص گروه2 ب(2ب)</td><td align="right" style="width:200px;">میدان شهدا- خیابان 17 شهریور- پایین تر از مترو امیر کبیر - نبش بن بست قانع - پلاک 1168 طبقه 4 واحد 9 </td><td><input type="button" value="انتخاب" onclick="javascript:__doPostBack('ctl00$cp1$grdKargroup','Select$0')" style="font-family:Tahoma;"></td>
		</tr>
	</tbody></table>
```

on page https://atabatorg.haj.ir/Kargozar/KargroupResLock.aspx when the client decided to go on one of the listed trips will post a request with their national ID, birthdate, phonenumber and trip data that is need to search for it on the table and find it then click on the button "انتخاب" of that trip. after clicking the button, the browser is redirected to https://atabatorg.haj.ir/Kargozar/Reservation_cs.aspx?resId=<SERVER_GENEGRATED_GUID> and on that page there are three fields that shall be filled with the posted data, then the submit button is clicked, and the asp page will show an alert tell the user to wait until the data are checked, if the national number and the birthdate do not match the page will show another alert indicating the error unless a new record is created on another table on the same page. the submit button on that new table must be clicked. but the user must be warned that they can not cancel a trip and choose another in 24 hours.

```
<table style="font-size: 9pt; font-family: tahoma; height: 97px; width: 800px;" class="Atabat" id="tblPassenger" onclick="return tblPassenger_onclick()">
            <tbody><tr class="header">
                <td style="height: 27px; text-align: right" colspan="9">مشخصات زائر:
                </td>
            </tr>
            <tr style="font-size: 9pt">
                <td style="width: 145px; height: 27px; text-align: left">کد ملی:
                </td>
                <td style="width: 209px; height: 27px; text-align: right">
                    <input type="text" id="txtMelliCode" style="width: 100px" class="Atabat" dir="ltr" maxlength="10">
                </td>
                <td style="width: 220px; height: 27px; text-align: left">تاریخ تولد:
                </td>
                <td style="width: 180px; height: 27px; text-align: right">
                    <input type="text" id="txtBDate" style="width: 100px; margin-bottom: 0px;" class="Atabat" dir="ltr" maxlength="10">
                </td>
                <td style="width: 94px; height: 27px; text-align: left">تلفن همراه:
                </td>
                <td style="width: 181px; height: 27px; text-align: right">
                    <input type="text" id="txtEmergincyTel" style="width: 100px;" class="Atabat" dir="ltr" maxlength="11">
                </td>

            </tr>
            <tr>
                <td>&nbsp;&nbsp;&nbsp;&nbsp;
                </td>
            </tr>
            <tr style="font-size: 9pt">

            </tr>
            <tr>
                <td>&nbsp;&nbsp;&nbsp;&nbsp;
                </td>
            </tr>
            <tr style="font-size: 9pt">
                <td style="text-align: center; height: 27px;" colspan="2">&nbsp;



                </td>
                <td style="width: 100px; height: 27px; text-align: left;">&nbsp;</td>
                <td style="width: 60px; height: 27px; text-align: right;">
                    <input type="text" disabled="true" id="txtfishomreh" style="width: 100px;visibility:hidden" class="Atabat" dir="ltr" maxlength="15" visible="False">
                    <input type="hidden" id="fishhiddentext" style="width: 100px;" class="Atabat" dir="ltr" maxlength="15">
                    <input type="hidden" id="TasKindhidden" class="Atabat" dir="ltr" maxlength="15">
                    <br>
                </td>
                <td style="">
                    <button id="btnOmrehcheck" disabled="true" onclick="callAjaxMethod()" style="width: 100px; height: 25px; background-color: darkseagreen;visibility:hidden;" type="button" validationgroup="passenger">
                        <span style="font-family: Tahoma; width: 80px; height: 25px;"><strong>کنترل عمره</strong></span>
                    </button>
                </td>
            </tr>
            <tr>
                <td>
                    <span id="lblmessage" style="width: 200px; color: red;"></span>
                </td>
            </tr>
            <tr>
                <td style="width: 100px; height: 27px; text-align: right"></td>
                <td style="width: 100px; height: 27px; text-align: right"></td>
                <td>
                    <button id="ctl00_cp1_btnSave" onclick="callAjaxRegister()" style="width: 100px; height: 20px; background-color: darkseagreen;" type="button" validationgroup="passenger">
                        <span style="font-family: Tahoma; width: 80px; height: 25px;"><strong>ثبت</strong></span>
                    </button>
                </td>

            </tr>
        </tbody></table>
```

The table created after successful submit:

```
<table style="width: 301px; visibility: visible; height: 51px;" id="tblOk" class="Atabat">
            <tbody><tr>
                <td colspan="3">&nbsp;<br>

                    <input type="submit" name="ctl00$cp1$btnSaveData" value="تائید و چاپ فیش" onclick="onFormSubmit();" id="ctl00_cp1_btnSaveData" style="color:Black;background-color:DarkSeaGreen;font-family:Tahoma;font-size:9pt;height:25px;width:118px;"><br>
                    <div id="ctl00_cp1_PnlTahilat">

                        <p>
                        </p>
                        <br>



	</div>
                </td>
            </tr>
        </tbody></table>
```

on page https://atabatorg.haj.ir/Kargozar/Receipt.aspx?resID=<SERVER_GENEGRATED_GUID> > there is a receipt, must be scraped, saved to database and showed to the user for confirmation. after user confirms it we will click on "جهت پرداخت اینترنتی توسط ملی کارت اینجا کلیک فرمائید" and new page will opens up it that page there is a "پرداخت" button it will be clicked and the page redirects us to an external payment gate but we don't open the page instead scrape the URL and save it to the database

```
<table class="Atabat" style="width: 700px;" cellspacing="0">
                    <tbody><tr class="header">
                        <td style="text-align: right" colspan="3">
                            رسید ثبت نام:
                        </td>
                        <td style="text-align: left" class="style3">
                            <input id="Button1" type="button" value="چاپ" onclick="window.print();" style="font-family: Tahoma;
                                height: 25px; width: 76px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left">
                            آخرین فرصت واریز هزینه :
                        </td>
                        <td style="text-align: right" class="style6">
                            <span id="ctl00_cp1_lblExpireDate" dir="ltr" style="display:inline-block;border-width:1px;border-style:Solid;font-weight:bold;"></span>
                        </td>
                        <td style="text-align: left" class="style3">
                            شهر:
                        </td>
                        <td style="text-align: right" class="style3">
                            <span id="ctl00_cp1_lblCity" style="font-weight:bold;">تهران</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left" class="style4">
                            نوع بسته زیارتی:
                        </td>
                        <td style="text-align: right" class="style7">
                            <span id="ctl00_cp1_lblType" style="font-weight:bold;">هوايي7شب امام خمینی نجف کاسپين/ کاظمين1 /سامرا عبوري/کربلا3/نجف3                                                                                                                                        </span>
                        </td>
                        <td style="text-align: left" class="style4">
                            &nbsp; تاریخ تشرف:
                        </td>
                        <td style="text-align: right" class="style4">
                            <span id="ctl00_cp1_lblDepdate" dir="ltr" style="font-weight:bold;">1404/10/05</span>
                            &nbsp;
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left" class="style5">
                            نام دفتر:
                        </td>
                        <td style="text-align: right" class="style8">
                            <br>
                            <span id="ctl00_cp1_lblKargozarTitle" style="font-weight:bold;text-align: right">زاگرس</span>
                        </td>
                        <td style="text-align: left" class="style5">
                            تلفن:
                        </td>
                        <td style="text-align: right" class="style5">
                            <span id="ctl00_cp1_lblKargozarTell" style="font-weight:bold;text-align: right">88820040</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left" class="style4">
                            آدرس دفتر:
                        </td>
                        <td colspan="3" style="text-align: right">
                            &nbsp;<span id="ctl00_cp1_lblAddress" style="display:inline-block;border-width:1px;border-style:Solid;font-weight:bold;">خیابان سپهبد قرنی، بالاتر از تقاطع طالقانی، پلاک 85</span>
                            &nbsp; &nbsp;
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left" class="style4">
                            نام شرکت مجری:</td>
                        <td colspan="3" style="text-align: right">
                            <span id="ctl00_cp1_lblExecutor" style="display:inline-block;border-width:1px;border-style:Solid;font-weight:bold;width:157px;">زاگرس</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="text-align: right" class="style1">
                            <span id="ctl00_cp1_lblNote"></span>
                            <b></b>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="text-align: right" class="style2">
                            <b>مدارک مورد نیاز جهت ثبت نام:<br>
                                &nbsp;&nbsp;&nbsp;&nbsp; </b>1-اصل گذرنامه بین المللی معتبر که از&nbsp; تاریخ
                            تشرف حداقل شش ماه&nbsp; اعتبار داشته باشد.<br>

                            <b>
                                <br>
                                نحوه پرداخت هزینه سفر:<br>
                                &nbsp;&nbsp;&nbsp;&nbsp; </b>&nbsp;&nbsp;&nbsp;&nbsp; -پرداخت اینترنتی&nbsp;<br>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4">
                            <br>
                            <div>
	<table cellspacing="0" rules="all" border="1" id="ctl00_cp1_grdReceiptPlan" style="font-family:Tahoma;font-size:9pt;width:600px;border-collapse:collapse;">
		<tbody><tr style="color:Black;background-color:DarkSeaGreen;height:20px;">
			<th scope="col">ردیف</th><th scope="col">تاریخ ورود</th><th scope="col">نام شهراقامتی</th><th scope="col">نام هتل</th><th scope="col">تاریخ خروج </th>
		</tr><tr style="background-color:White;height:30px;">
			<td>1</td><td>1404/10/05</td><td>کاظمين</td><td>قرطاج(جنه الباقر)</td><td>1404/10/06</td>
		</tr><tr style="background-color:#D9EAD9;height:30px;">
			<td>2</td><td>1404/10/06</td><td>کربلا</td><td>ملک</td><td>1404/10/09</td>
		</tr><tr style="background-color:White;height:30px;">
			<td>3</td><td>1404/10/09</td><td>نجف</td><td>اسطوره</td><td>1404/10/12</td>
		</tr><tr style="background-color:#D9EAD9;height:30px;">
			<td>4</td><td>1404/10/06</td><td>سامرا</td><td>اقامت ندارد(عبوري)</td><td>1404/10/06</td>
		</tr>
	</tbody></table>
	</div>
                            <br>
                            <div>
	<table cellspacing="0" rules="all" border="1" id="ctl00_cp1_grdPrePassenger" style="font-family:Tahoma;font-size:9pt;width:600px;border-collapse:collapse;">
		<tbody><tr style="color:Black;background-color:DarkSeaGreen;height:20px;">
			<th scope="col">شناسه زائر</th><th scope="col">کد ملی</th><th scope="col">نام</th><th scope="col">نام خانوادگی</th><th scope="col">تاریخ تولد</th><th scope="col">هزینه سفر</th>
		</tr><tr style="background-color:White;height:30px;">
			<td>17775499</td><td>0820531261</td><td>امين</td><td>زيبائي</td><td class="ltr">1382/02/27</td><td>349160462</td>
		</tr>
	</tbody></table>
	</div>

                    </td></tr>
                    <tr>
                        <td colspan="4" style="text-align: center" class="auto-style1">
                            <br>

                            <br>
                            <br>
                        <a id="ctl00_cp1_EPaymentHyperLinkNew" href="https://atabatorg.haj.ir/epay/home/IndexEpay?resID=6aa67510-69db-f011-968d-005056afa4dd&amp;ResIDStatus=1&amp;App=atabatorg&amp;UID=cbb41481-b21e-4bc4-931e-83b64e87b6b3" style="color:#FF66CC;font-weight:bold;">جهت پرداخت اینترنتی توسط ملی کارت اینجا کلیک فرمائید</a>

                            <br>
                            <br>
                            <hr>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4">
                            <br>
                            <div>

	</div>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="4" style="text-align: center" class="auto-style1">
                            <br>
                            <span id="ctl00_cp1_lblMsg" style="color:Red;"></span>

                            <br>
                            <br>

                            <br>
                            <br>
                        </td>
                    </tr>
                </tbody>
</table>
```

there are two way to access page https://atabatorg.haj.ir/Kargozar/Receipt.aspx?resID=<SERVER_GENEGRATED_GUID>, one way is first time registration and it will be shown after https://atabatorg.haj.ir/Kargozar/Reservation_cs.aspx?resId=<SERVER_GENEGRATED_GUID> the other way is going to https://atabatorg.haj.ir/Kargozar/KargroupReslockStatus.aspx, searching for records and clicking on "چاپ فیش" button of the corresponding row to our user+trip which redirects us the the desired receipt page

```
<table style="width: 821px" class="Atabat">
        <tbody><tr class="header">
            <td colspan="8" style="text-align: right; height: 22px;">
                وضعیت ثبت نام های مقدماتی انجام شده
            </td>
        </tr>
        <tr>
               <td style="text-align: left; width: 81px; height: 31px;">
                کشور مقصد:
            </td>
             <td style=" text-align: right; height: 31px;">

                <select name="ctl00$cp1$cmbExtType" onchange="javascript:setTimeout('__doPostBack(\'ctl00$cp1$cmbExtType\',\'\')', 0)" id="ctl00_cp1_cmbExtType" style="font-family:Tahoma;font-size:9pt;width:112px;">
	<option selected="selected" value="0">عراق</option>
	<option value="1">سوریه</option>

	</select>

                 </td>
        </tr>
        <tr>
            <td style="text-align: left; width: 81px;">
                از تاریخ:
            </td>
            <td style="width: 116px; text-align: right">
                <input name="ctl00$cp1$txtDateFrom" type="text" value="1404/09/26" id="ctl00_cp1_txtDateFrom" dir="ltr" style="border-color:DarkSeaGreen;border-width:1px;border-style:Solid;font-family:Tahoma;font-size:9pt;height:22px;width:100px;">
            </td>
            <td style="width: 66px; text-align: left">
                تا تاریخ:
            </td>
            <td style="width: 108px; text-align: right">
                <input name="ctl00$cp1$txtDateTo" type="text" value="1404/09/27" id="ctl00_cp1_txtDateTo" dir="ltr" style="border-color:DarkSeaGreen;border-width:1px;border-style:Solid;font-family:Tahoma;font-size:9pt;height:22px;width:100px;">
            </td>

            <td style="width: 110px; text-align: right">
            </td>
            <td style="text-align: right">
                <input type="submit" name="ctl00$cp1$btnLoad" value="بازیابی" id="ctl00_cp1_btnLoad" style="color:Black;background-color:DarkSeaGreen;font-family:Tahoma;font-size:9pt;width:100px;">
            </td>
            <td>
                <input type="submit" name="ctl00$cp1$exportToExcelButton" value="دریافت فایل Excel" id="ctl00_cp1_exportToExcelButton" style="color:Black;background-color:DarkSeaGreen;font-family:Tahoma;font-size:9pt;width:146px;">
            </td>
        </tr>
        <tr>
            <td colspan="7">
                <div>

	</div>
            </td>
        </tr>
        <tr>
            <td colspan="7">

            </td>
        </tr>
    </tbody>
</table>
```

data:

```
<table cellspacing="0" rules="all" border="1" id="ctl00_cp1_grdResLockStatus" style="font-family:Tahoma;font-size:9pt;height:168px;width:784px;border-collapse:collapse;">
		<tbody><tr style="color:Black;background-color:DarkSeaGreen;height:20px;">
			<th scope="col">کاربر</th><th scope="col">تاریخ ثبت نام مقدماتی</th><th scope="col">کارگزار عامل</th><th scope="col">کد کارگزار</th><th scope="col">تاریخ اعزام</th><th scope="col">شماره گروه</th><th scope="col">تعداد بلاک</th><th scope="col">وضعیت</th><th scope="col">&nbsp;</th><th scope="col">&nbsp;</th>
		</tr><tr style="background-color:White;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 11:12:04 ب.ظ</td><td>دریای کرم حسین(ع)</td><td>57518</td><td class="ltr">1404/09/28</td><td>3267</td><td>1</td><td>باطل شده</td><td disabled="disabled"><input type="button" value="چاپ فیش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td><td disabled="disabled"><input type="button" value="نمایش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td>
		</tr><tr style="background-color:#D9EAD9;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 08:47:18 ب.ظ</td><td>زاگرس</td><td>57985</td><td class="ltr">1404/10/05</td><td>684</td><td>1</td><td>باطل شده</td><td disabled="disabled"><input type="button" value="چاپ فیش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td><td disabled="disabled"><input type="button" value="نمایش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td>
		</tr><tr style="background-color:White;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 08:24:42 ب.ظ</td><td>زاگرس</td><td>57985</td><td class="ltr">1404/10/05</td><td>684</td><td>1</td><td>ثبت نام شده</td><td><input type="button" value="چاپ فیش" onclick="javascript:__doPostBack('ctl00$cp1$grdResLockStatus','PrintFish$2')" style="font-family:tahoma;font-size:9pt;"></td><td><input type="button" value="نمایش" onclick="javascript:__doPostBack('ctl00$cp1$grdResLockStatus','ShowResLock$2')" style="font-family:tahoma;font-size:9pt;"></td>
		</tr><tr style="background-color:#D9EAD9;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 08:15:19 ب.ظ</td><td>دریای کرم حسین(ع)</td><td>57518</td><td class="ltr">1404/09/28</td><td>3267</td><td>1</td><td>باطل شده</td><td disabled="disabled"><input type="button" value="چاپ فیش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td><td disabled="disabled"><input type="button" value="نمایش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td>
		</tr><tr style="background-color:White;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 08:10:08 ب.ظ</td><td>دریای کرم حسین(ع)</td><td>57518</td><td class="ltr">1404/09/28</td><td>3267</td><td>1</td><td>باطل شده</td><td disabled="disabled"><input type="button" value="چاپ فیش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td><td disabled="disabled"><input type="button" value="نمایش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td>
		</tr><tr style="background-color:#D9EAD9;height:30px;">
			<td>موج زمزم</td><td class="ltr">1404/09/26 07:52:10 ب.ظ</td><td>خادمان حریم نینوا</td><td>79023</td><td class="ltr">1404/10/02</td><td>126</td><td>1</td><td>باطل شده</td><td disabled="disabled"><input type="button" value="چاپ فیش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td><td disabled="disabled"><input type="button" value="نمایش" disabled="disabled" style="font-family:tahoma;font-size:9pt;"></td>
		</tr>
	</tbody>
</table>
```

General User Workflow:
Sign-ups with phone number and password
Logins
can search for the trip in a certain period of time and from whatever province they prefer
select a trip they desire to go on
enters their national ID + birthdate if not already entered, (the data both sent to Atabat and saved to the profile)
a reservation is created and saved to database, they can see it in another table if they desire
the reservation is has pending payment status, after they pay for the reservation the reservation will have paid status and finalized

In addtion to restful api that interacts with atabat site through playwright under the hood, there must be a user panel and an admin panel

the admin may view the users and the reservation they made
the admin is actually a kargozar that enters their username and password and
daily OTP to enable the system to login to the original atabat site
