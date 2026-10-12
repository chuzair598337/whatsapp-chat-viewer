"use strict";
/* =====================================================================
   Release notes for the "What's new" popup (js/components/whats-new.js).

   - Newest version first. The first entry's `v` must equal APP_VERSION
     (js/components/settings.js) and the top released heading in
     CHANGELOG.md; tests/release-notes.test.js checks this and the deploy
     to GitHub Pages runs that test.
   - A release adds its entry here, written from the CHANGELOG's
     "Unreleased" section (.claude/skills/release-skill). Day-to-day work
     on `development` doesn't touch this file.
   - kind: 'new' (a feature), 'improved' (a change to one) or 'fixed'
     (a bug or issue resolved). Each item has one short sentence in
     English, Urdu and Arabic; a missing language falls back to English.
   - Plain text only, no HTML: it's escaped when shown.
   ===================================================================== */
const RELEASE_NOTES = [
  {
    v: '1.13.0', date: '2026-10-12',
    items: [
      { kind: 'new',
        en: 'Settings › Text size makes the chat text smaller or bigger, from 90% to 150%. In a chat, + and - change it one step.',
        ur: 'ترتیبات › متن کا سائز سے چیٹ کا متن 90% سے 150% تک چھوٹا یا بڑا کریں۔ چیٹ میں + اور - اسے ایک قدم بدلتے ہیں۔',
        ar: 'من الإعدادات › حجم النص يمكنك تصغير نص الدردشة أو تكبيره من 90% إلى 150%. في الدردشة يغيّره + و- خطوة واحدة.' },
      { kind: 'improved',
        en: 'On phones, the photo and PDF viewers have a Back arrow and a ⋮ button that holds Rotate, Star, Download and the other options.',
        ur: 'فون پر تصویر اور PDF دیکھنے والے میں واپس کا تیر اور ⋮ بٹن ہے جس میں گھمانا، ستارہ، ڈاؤن لوڈ اور باقی اختیارات ہیں۔',
        ar: 'على الهاتف، أصبح لعارض الصور وعارض PDF سهم رجوع وزر ⋮ يضم التدوير والتمييز بنجمة والتنزيل وبقية الخيارات.' },
      { kind: 'improved',
        en: 'Search now counts every match, not every message, so ↑ and ↓ step through each highlighted word.',
        ur: 'تلاش اب ہر پیغام نہیں بلکہ ہر مماثلت گنتی ہے، اس لیے ↑ اور ↓ ہر نمایاں لفظ پر جاتے ہیں۔',
        ar: 'أصبح البحث يعدّ كل تطابق لا كل رسالة، فينتقل ↑ و↓ بين كل كلمة مميّزة.' },
      { kind: 'improved',
        en: 'A message that never loaded on the exporting phone now shows a clear "Message wasn\'t loaded" card.',
        ur: 'جو پیغام ایکسپورٹ کرنے والے فون پر کبھی لوڈ نہیں ہوا، اب وہ واضح کارڈ "یہ پیغام لوڈ نہیں ہوا تھا" کے ساتھ دکھتا ہے۔',
        ar: 'الرسالة التي لم يكتمل تحميلها على الهاتف الذي صدّر الدردشة تظهر الآن في بطاقة واضحة: "لم يكتمل تحميل الرسالة".' },
      { kind: 'improved',
        en: 'Media, links and docs shows only the kinds of media the chat has, with no empty "0" tiles.',
        ur: 'میڈیا، لنکس اور دستاویزات اب صرف وہی اقسام دکھاتا ہے جو چیٹ میں ہیں، خالی "0" والی ٹائلیں نہیں۔',
        ar: 'تعرض الوسائط والروابط والمستندات الآن الأنواع الموجودة في الدردشة فقط، دون مربعات فارغة بالرقم 0.' },
      { kind: 'improved',
        en: 'Better on every screen: two panes on an iPad in landscape, Starred messages as a third column from 1200 px, and a compact layout for phones on their side.',
        ur: 'ہر اسکرین پر بہتر: لینڈ اسکیپ آئی پیڈ پر دو حصے، 1200 px سے ستارہ لگے پیغامات تیسرے کالم میں، اور فون کو ترچھا رکھنے پر مختصر لے آؤٹ۔',
        ar: 'أفضل على كل شاشة: لوحتان على iPad بالوضع الأفقي، والرسائل المميزة بنجمة كعمود ثالث من 1200 px، وتخطيط مضغوط للهاتف في الوضع الأفقي.' },
      { kind: 'fixed',
        en: 'iPhone no longer zooms in when you tap the search box or a filter, and the page no longer slides sideways on phones.',
        ur: 'آئی فون پر سرچ باکس یا فلٹر پر ٹیپ کرنے سے صفحہ اب زوم نہیں ہوتا، اور فون پر صفحہ اب دائیں بائیں نہیں کھسکتا۔',
        ar: 'لم يعد iPhone يكبّر الصفحة عند النقر على مربع البحث أو مرشّح، ولم تعد الصفحة تنزلق جانبيًا على الهواتف.' },
      { kind: 'fixed',
        en: 'In Urdu and Arabic, the photo viewer\'s counter and time, PDF zoom, shortcut keys and English chat titles now read correctly.',
        ur: 'اردو اور عربی میں تصویر دیکھنے والے کا شمار اور وقت، PDF زوم، شارٹ کٹ کیز اور انگریزی چیٹ کے نام اب درست پڑھے جاتے ہیں۔',
        ar: 'في العربية والأردية، يظهر الآن عدّاد عارض الصور ووقته وتكبير PDF ومفاتيح الاختصار وأسماء الدردشات الإنجليزية بشكل صحيح.' }
    ]
  },
  {
    v: '1.12.0', date: '2026-10-12',
    items: [
      { kind: 'new',
        en: 'Export and Import in Starred messages: save your stars to a file on your device and star the same messages again the next time you open that chat.',
        ur: 'ستارہ لگے پیغامات میں ایکسپورٹ اور امپورٹ: اپنے ستارے اپنے آلے پر ایک فائل میں محفوظ کریں، اور اگلی بار یہ چیٹ کھولنے پر وہی پیغامات دوبارہ ستارہ لگے دیکھیں۔',
        ar: 'تصدير واستيراد في الرسائل المميزة بنجمة: احفظ نجومك في ملف على جهازك، وميّز الرسائل نفسها بنجمة مجددًا عندما تفتح هذه الدردشة مرة أخرى.' },
      { kind: 'improved',
        en: 'Starred messages now look like the chat, with each message in its own bubble, its sender and its date.',
        ur: 'ستارہ لگے پیغامات اب چیٹ جیسے دکھتے ہیں: ہر پیغام اپنے ببل میں، بھیجنے والے اور تاریخ کے ساتھ۔',
        ar: 'تبدو الرسائل المميزة بنجمة الآن مثل الدردشة: كل رسالة في فقاعتها مع مرسلها وتاريخها.' },
      { kind: 'new',
        en: 'Photos and Videos in Media, links and docs can be shown as a list or a small, medium or large grid with the new View button, or V.',
        ur: 'میڈیا، لنکس اور دستاویزات میں تصاویر اور ویڈیوز کو نئے منظر بٹن یا V سے فہرست، یا چھوٹے، درمیانے یا بڑے گرڈ میں دیکھا جا سکتا ہے۔',
        ar: 'يمكن عرض الصور والفيديوهات في الوسائط والروابط والمستندات كقائمة أو شبكة صغيرة أو متوسطة أو كبيرة بزر طريقة العرض الجديد أو بالمفتاح V.' },
      { kind: 'improved',
        en: 'On a laptop or desktop, Media, links and docs opens wider and shows every option of a row as a button, in two columns.',
        ur: 'لیپ ٹاپ یا ڈیسک ٹاپ پر میڈیا، لنکس اور دستاویزات زیادہ چوڑا کھلتا ہے اور ہر قطار کے سارے آپشن بٹن کی صورت میں، دو کالموں میں دکھاتا ہے۔',
        ar: 'على الحاسوب المحمول أو المكتبي تُفتح الوسائط والروابط والمستندات بعرض أكبر، وتظهر كل خيارات الصف كأزرار في عمودين.' },
      { kind: 'improved',
        en: 'Less empty space on large screens: the app uses up to 1920 px, and Settings and Keyboard shortcuts open wider.',
        ur: 'بڑی اسکرینوں پر کم خالی جگہ: ایپ 1920 px تک پھیلتی ہے، اور ترتیبات اور کی بورڈ شارٹ کٹس زیادہ چوڑے کھلتے ہیں۔',
        ar: 'مساحة فارغة أقل على الشاشات الكبيرة: يمتد التطبيق حتى 1920 px، وتُفتح الإعدادات واختصارات لوحة المفاتيح بعرض أكبر.' }
    ]
  },
  {
    v: '1.11.0', date: '2026-10-11',
    items: [
      { kind: 'new',
        en: 'What\'s new: after each update, a popup like this one lists what changed. Settings › About shows it again.',
        ur: 'نیا کیا ہے: ہر اپ ڈیٹ کے بعد ایسا ہی ایک پاپ اپ بتاتا ہے کہ کیا بدلا۔ ترتیبات › تعارف میں یہ دوبارہ دیکھیں۔',
        ar: 'ما الجديد: بعد كل تحديث تعرض نافذة مثل هذه ما تغيّر. يمكنك رؤيتها مجددًا من الإعدادات › حول.' },
      { kind: 'new',
        en: 'Keyboard shortcuts for every major action, such as Ctrl+O or ⌘O to open a chat, Ctrl+F or ⌘F to search, and J and K to move between messages.',
        ur: 'ہر بڑے کام کے لیے کی بورڈ شارٹ کٹس، جیسے چیٹ کھولنے کے لیے Ctrl+O یا ⌘O، تلاش کے لیے Ctrl+F یا ⌘F، اور پیغامات میں آگے پیچھے جانے کے لیے J اور K۔',
        ar: 'اختصارات لوحة المفاتيح لكل إجراء رئيسي، مثل Ctrl+O أو ⌘O لفتح دردشة، وCtrl+F أو ⌘F للبحث، وJ وK للتنقل بين الرسائل.' },
      { kind: 'new',
        en: 'Press ? to see every keyboard shortcut. The list is also in Settings and the ⋮ menu.',
        ur: 'تمام کی بورڈ شارٹ کٹس دیکھنے کے لیے ? دبائیں۔ یہ فہرست ترتیبات اور ⋮ مینو میں بھی ہے۔',
        ar: 'اضغط ? لرؤية كل اختصارات لوحة المفاتيح. القائمة موجودة أيضًا في الإعدادات والقائمة ⋮.' },
      { kind: 'new',
        en: 'Settings › Single-key shortcuts turns off the one-key shortcuts if they get in the way.',
        ur: 'ترتیبات › ایک کلید والے شارٹ کٹس سے ایک کلید والے شارٹ کٹس بند کیے جا سکتے ہیں اگر وہ رکاوٹ بنیں۔',
        ar: 'من الإعدادات › الاختصارات بمفتاح واحد يمكنك إيقاف هذه الاختصارات إذا أزعجتك.' },
      { kind: 'fixed',
        en: 'Shortcuts such as Ctrl+F now work with an Urdu or Arabic keyboard layout, and the search button shows ⌘F on a Mac.',
        ur: 'Ctrl+F جیسے شارٹ کٹس اب اردو یا عربی کی بورڈ لے آؤٹ کے ساتھ بھی چلتے ہیں، اور Mac پر تلاش کا بٹن ⌘F دکھاتا ہے۔',
        ar: 'تعمل الاختصارات مثل Ctrl+F الآن مع تخطيط لوحة مفاتيح عربي أو أردي، ويعرض زر البحث ⌘F على Mac.' }
    ]
  },
  {
    v: '1.10.0', date: '2026-10-11',
    items: [
      { kind: 'new',
        en: 'Autoplay voice messages: when one ends, the next voice message plays. Turn it on in Settings.',
        ur: 'وائس پیغامات خود بخود چلائیں: ایک ختم ہو تو اگلا وائس پیغام چل جاتا ہے۔ اسے ترتیبات میں آن کریں۔',
        ar: 'التشغيل التلقائي للرسائل الصوتية: عندما تنتهي رسالة تُشغَّل الرسالة الصوتية التالية. فعّله من الإعدادات.' },
      { kind: 'new',
        en: 'An Autoplay button on Audio in Media, links and docs plays the list one after another.',
        ur: '«میڈیا، لنکس اور دستاویزات» میں آڈیو پر خودکار چلانے کا بٹن فہرست کو ایک کے بعد ایک چلاتا ہے۔',
        ar: 'زر التشغيل التلقائي في قسم الصوت ضمن «الوسائط والروابط والمستندات» يشغّل القائمة واحدًا تلو الآخر.' },
      { kind: 'new',
        en: 'Tap a person under Participants to see only their messages. Tap again to see everyone.',
        ur: 'شرکاء میں کسی پر ٹیپ کریں تو صرف ان کے پیغامات نظر آتے ہیں۔ دوبارہ ٹیپ کریں تو سب کے۔',
        ar: 'اضغط على شخص في قائمة المشاركين لعرض رسائله فقط، واضغط مرة أخرى لعرض الجميع.' },
      { kind: 'improved',
        en: '"Which one is you?" can be closed when you open it from Settings.',
        ur: '«ان میں آپ کون ہیں؟» ترتیبات سے کھولیں تو اسے بند کیا جا سکتا ہے۔',
        ar: 'يمكن إغلاق «أيّ هؤلاء أنت؟» عند فتحه من الإعدادات.' },
      { kind: 'improved',
        en: 'Tapping a waveform moves only the note that is playing, so scrolling no longer starts a note by mistake.',
        ur: 'ویوفارم پر ٹیپ صرف چلتے ہوئے نوٹ کو آگے پیچھے کرتا ہے، اس لیے اسکرول کرتے ہوئے غلطی سے کوئی نوٹ نہیں چلتا۔',
        ar: 'الضغط على الموجة الصوتية يحرّك الرسالة التي تُشغَّل فقط، فلا تبدأ رسالة بالخطأ أثناء التمرير.' }
    ]
  },
  {
    v: '1.9.0', date: '2026-10-10',
    items: [
      { kind: 'new',
        en: 'Search options: Match case, Whole word and Regex, in the search bar.',
        ur: 'تلاش کے اختیارات: کیس ملائیں، پورا لفظ اور ریجیکس، تلاش کی پٹی میں۔',
        ar: 'خيارات البحث: مطابقة الحالة وكلمة كاملة وتعبير نمطي، في شريط البحث.' },
      { kind: 'improved',
        en: 'The search text is selected after a search, so you can type a new one straight away.',
        ur: 'تلاش کے بعد تلاش کا متن منتخب ہو جاتا ہے، اس لیے آپ فوراً نئی تلاش لکھ سکتے ہیں۔',
        ar: 'يُحدَّد نص البحث بعد البحث، فتستطيع كتابة بحث جديد مباشرة.' },
      { kind: 'improved',
        en: 'The guided tour covers the newest features.',
        ur: 'رہنما ٹور میں نئی خصوصیات بھی شامل ہیں۔',
        ar: 'تشمل الجولة الإرشادية أحدث الميزات.' }
    ]
  },
  {
    v: '1.8.0', date: '2026-10-10',
    items: [
      { kind: 'new',
        en: 'Nicknames for anyone in the chat, from Settings or from "Which one is you?".',
        ur: 'چیٹ میں کسی کو بھی عرفی نام دیں، ترتیبات سے یا «ان میں آپ کون ہیں؟» سے۔',
        ar: 'ألقاب لأي شخص في الدردشة، من الإعدادات أو من «أيّ هؤلاء أنت؟».' },
      { kind: 'new',
        en: 'Recent searches show under the search bar.',
        ur: 'حالیہ تلاشیں تلاش کی پٹی کے نیچے نظر آتی ہیں۔',
        ar: 'تظهر عمليات البحث الأخيرة تحت شريط البحث.' },
      { kind: 'new',
        en: 'Options for each item in Media, links and docs, including Go to message.',
        ur: '«میڈیا، لنکس اور دستاویزات» میں ہر چیز کے اختیارات، بشمول «پیغام پر جائیں»۔',
        ar: 'خيارات لكل عنصر في «الوسائط والروابط والمستندات»، ومنها «الانتقال إلى الرسالة».' },
      { kind: 'new',
        en: 'Links show the site\'s logo and what the link is. Online previews can be turned on in Settings.',
        ur: 'لنکس پر سائٹ کا لوگو اور لنک کی قسم نظر آتی ہے۔ آن لائن پیش منظر ترتیبات میں آن کیے جا سکتے ہیں۔',
        ar: 'تعرض الروابط شعار الموقع ونوع الرابط. ويمكن تفعيل المعاينة عبر الإنترنت من الإعدادات.' },
      { kind: 'improved',
        en: 'On phones, rows in Media, links and docs show only the ⋮ button, leaving more room for the text.',
        ur: 'فون پر «میڈیا، لنکس اور دستاویزات» کی قطاروں میں صرف ⋮ بٹن ہے، اس لیے متن کو زیادہ جگہ ملتی ہے۔',
        ar: 'على الهاتف، تعرض صفوف «الوسائط والروابط والمستندات» زر ⋮ فقط، فيبقى للنص مساحة أكبر.' },
      { kind: 'fixed',
        en: 'Voice notes and audio files play on iPhone again.',
        ur: 'وائس نوٹس اور آڈیو فائلیں iPhone پر دوبارہ چلتی ہیں۔',
        ar: 'تعمل الرسائل الصوتية والملفات الصوتية على iPhone من جديد.' },
      { kind: 'fixed',
        en: '"1 messages" now reads "1 message".',
        ur: 'ایک پیغام کی گنتی اب درست لکھی جاتی ہے۔',
        ar: 'أصبح عدد الرسالة الواحدة يُكتب بشكل صحيح.' }
    ]
  }
];
