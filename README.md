# 🐑 Otam Fermasi (Qo'ychilik Xo'jaligi Boshqaruv Tizimi)

**Otam Fermasi** — qo'ychilik xo'jaligi operatsiyalarini yuritish, 1 oylik yem-xashak va don sarfini hisoblash hamda ta'minot xarajatlarini nazorat qilish uchun maxsus yaratilgan zamonaviy veb-ilova. Dastur ikki kishi — katta aka va uka uchun qulay qilib ishlab chiqilgan.

---

## 🌟 Asosiy Imkoniyatlar (Функционал)

1. **Oylik Yem va Don Hisoblagichi (Калькулятор кормов)**:
   - Suruvdagi qo'ylar soni (Sovliqlar, Qo'chqorlar, Qo'zilar, Bo'rdoqi) asosida kunlik va oylik (30 kunlik) ratsionni hisoblaydi.
   - Beda (press), Somon, Arpa, Bug'doy, Kombikorm va tuz kabi ozuqalarning umumiy tonnaji va taxminiy oylik qiymatini chiqaradi.
   - Omborda qolgan yem zaxirasi necha kunga yetishini ko'rsatib, kam qolganda ogohlantiradi.

2. **Ta'minot Xarajatlari (Учёт закупок и расходов)**:
   - Yem-xashak, dori-darmon va vaksinalar, texnika va asboblar, qurilish mollari xaridlarini kiritish.
   - Kim to'lagani (**Katta akam** yoki **Men**), to'lov turi (naqd, karta, nasiya) va sotuvchi ma'lumotlarini saqlash.

3. **Aka-Uka O'rtasidagi Hisob-Kitob (Взаиморасчёты)**:
   - Kim qancha xarajat qilganini taqqoslaydi.
   - Xarajatlar teng bo'linishi uchun kim kimga qancha berishi kerakligini avtomatik hisoblab beradi.

4. **Ikki Tilli Interfeys (Двуязычный интерфейс)**:
   - 🇺🇿 **O'zbekcha** (Lotin yozuvida to'liq chorvachilik terminlari)
   - 🇷🇺 **Русский** (Полная локализация на русский язык)
   - Bir tugma orqali tilni darhol almashtirish.

5. **Dizayn va Ranglar Gammasi**:
   - Asosiy oq va yengil qaymoqrang fon (quyoshda ham ko'rishga qulay).
   - Maysazor va yaylov yashili (hosildorlik va o'sish).
   - Mo''tadil, yoqimli yog'och va tuproq tusli jigar rang urg'ulari (me'yorida ishlatilgan).

---

## 🚀 Ishga Tushirish (Как запустить)

### 1-usul: Eng osoni (Brauzerda to'g'ridan-to'g'ri ochish)
- `index.html` faylini sichqoncha bilan 2 marta bosing (yoki Chrome / Edge brauzeriga tashlang).
- Dastur internet bo'lmasa ham to'liq ishlaydi.

### 2-usul: 1-bosishda ishga tushirish (Windows)
- `start.bat` faylini ikki marta bosing. U avtomatik serverni ishga tushirib brauzerni ochadi.

### 3-usul: Telefonda ochish (Aka-uka ikkalangiz bir xil Wi-Fi da foydalanish)
Serverni ishga tushiring:
```powershell
& "C:\Users\Abduaziz\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
```
Konsolda ko'rsatilgan IP manzilni (masalan `http://192.168.1.50:3000`) telefoningiz brauzerida oching. Shunda ikkalangiz ham qo'radan turib yangi xaridlarni kiritishingiz mumkin.

---

## 💾 Ma'lumotlarni Saqlash va Zaxira (Резервное копирование)
- Barcha ma'lumotlar brauzer xotirasida va serverda avtomatik saqlanadi.
- Yuqori o'ng burchakdagi zaxira tugmasi orqali ma'lumotlarni **JSON** formatda yuklab olish yoki **Excel (CSV)** formatida chiqarish mumkin.
