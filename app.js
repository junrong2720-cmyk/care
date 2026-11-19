/* 随诊本 · Care Notebook —— 患者端。纯静态，无依赖；数据只存在本机 IndexedDB。
   处方由医师端（tcm-clinic）生成链接：#rx=<z|j><base64url>，z = deflate-raw 压缩的 JSON，j = 未压缩 JSON。
   链接里的数据放在 # 后面，浏览器不会把它发给网站服务器。 */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 文案（中 / 英 / 马来文） ---------- */
  const MS_MON = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const MS_DAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const LANGS = [['zh', '中文'], ['en', 'English'], ['ms', 'Bahasa Melayu']];
  const I = {
    zh: {
      tabToday: '今天', tabRx: '处方', tabDiary: '日记', tabMe: '我的',
      hello: n => (n ? n + '，' : '') + '你好',
      weekday: s => '星期' + '日一二三四五六'[parseYmd(s).getDay()],
      notes: {}, listSep: '、',
      g: {
        crush: j => j + ' 煎前先打碎。',
        bag: j => j + ' 装进纱布袋扎紧，和其他药一起煎。',
        soak: ex => '把药' + (ex ? '（' + ex + ' 除外）' : '') + '放进锅里，加冷水没过药面 2–3 厘米，浸泡 30 分钟。',
        pre: j => j + ' 要先煎：先放进锅里，煮沸后小火煎 30 分钟，再放入其他药。',
        boil: '大火煮沸后转小火，保持微微沸腾 20–30 分钟。',
        late: j => j + ' 要后下：关火前 5–10 分钟才放进去。',
        second: '倒出药液。再加水没过药面，煮沸后小火煎 15–20 分钟，倒出第二遍药液。',
        sep: j => j + ' 用小锅单独煎，取汁兑入药液。',
        mix: n => '两遍药液混合（约 300–400 毫升），' + (n === 1 ? '一次温服。' : '分 ' + n + ' 次温服。'),
        melt: j => j + ' 不下锅：放在杯里，用热药液搅拌溶化后服。',
        stir: j => j + ' 不下锅：服药时用温热药液冲服。'
      },
      noRxTitle: '还没有处方',
      noRxText: '看诊后，医生会发给你一个处方链接。点开它，处方就会保存在这里，帮你记住每天服药、煎药方法和复诊时间。',
      demo: '看看示例', demoTag: '示例',
      courseDay: (n, m) => '第 ' + n + ' 天 / 共 ' + m + ' 天',
      upcoming: d => d + ' 开始服药',
      courseDone: '本疗程已服完',
      takenOf: (a, b) => '已服 ' + a + ' / ' + b + ' 次',
      guide: '煎药方法', timer: '煎药计时',
      followUp: '复诊', fuIn: n => '还有 ' + n + ' 天', fuToday: '就是今天', fuPast: n => '已过 ' + n + ' 天', fuNone: '医生没有写复诊日期，可以在处方里自己设置。',
      toCal: '加到手机日历', summary: '复诊小结',
      howFeel: '今天感觉怎么样？', moreDiary: '写详细日记',
      saved: '已保存',
      feel: ['很差', '较差', '一般', '较好', '很好'],
      sleep: '睡眠', appetite: '胃口', stool: '大便',
      gfp: { g: '好', f: '一般', p: '差' },
      stoolOpts: { n: '正常', d: '偏干', l: '偏稀', x: '未解' },
      noteLabel: '其他感受（症状变化、不舒服的地方）', notePh: '例如：胃胀轻了，饭后还有点反酸',
      tongue: '舌象照片', tongueTip: '自然光下拍，舌头自然伸出、放松，不要刚吃完东西或喝有颜色的饮料。', addPhoto: '拍照 / 选照片',
      trend: '近 14 天感觉', noData: '还没有记录',
      dosesOn: '当天服药',
      rxList: '我的处方', rxEmpty: '还没有处方',
      status: { active: '服药中', upcoming: '未开始', done: '已服完' },
      herbsN: (n, k) => '共 ' + n + ' 味 × ' + k + ' 剂',
      usage: '服法', advice: '医嘱', dx: '诊断', doctor: '医师', date: '开方日期', patient: '患者',
      courseSet: '疗程', startDate: '开始服药日期', perDay: '每天服几次', fuDate: '复诊日期',
      remind: '服药提醒加到日历', del: '删除这张处方', delConfirm: '确定删除这张处方吗？对应的服药打卡也会删除（日记保留）。',
      back: '‹ 返回',
      newRx: '收到一张新处方', updRx: '这张处方有更新', saveRx: '保存到随诊本', cancel: '取消', ok: '好',
      badLink: '处方链接不完整或已损坏，请让医生重新发送。',
      oldBrowser: '浏览器版本太旧，打不开这个处方。请升级，或换用 Chrome / Safari 打开。',
      myName: '我的称呼', lang: '语言 Language', times: '服药提醒时间',
      backup: '数据备份', exportB: '导出备份文件', importB: '从备份恢复', clear: '清空所有数据',
      clearConfirm: '确定清空所有处方和日记吗？此操作无法撤销。', importConfirm: '用备份文件替换现在的全部数据？', importOk: '已恢复', importBad: '这不是随诊本的备份文件',
      install: '安装到手机桌面',
      installIOS: 'iPhone：用 Safari 打开 → 点底部「分享」→「添加到主屏幕」',
      installAndroid: 'Android：用 Chrome 打开 → 右上角「⋮」→「添加到主屏幕」或「安装应用」',
      installBtn: '一键安装', installed: '已安装在桌面，可以像 App 一样打开。',
      wechat: '在微信里打开，数据可能会丢失。请点右上角「···」→「在浏览器打开」，再添加到主屏幕。',
      privacy: '你的处方和日记只保存在这台手机上，不会上传到任何服务器。换手机前请先导出备份。',
      disclaimer: '本应用只用于记录与提醒，不能替代医生诊疗。服药期间如有明显不适，请暂停服药并及时联系医生或就医。',
      copy: '复制', share: '发给医生', copied: '已复制，可以粘贴到微信发给医生',
      sumHint: '复诊前把这段小结发给医生，方便了解你这段时间的情况。', sumNoRx: '还没有处方，暂时没有可以总结的内容。',
      timerHint: '计时期间请保持本页打开，时间到会响铃并震动。', timerDone: '时间到了！', timerRun: '煎药计时', stop: '停止', view: '查看', min: '分钟',
      presets: [[30, '浸泡 / 先煎'], [25, '头煎'], [15, '二煎'], [8, '后下']],
      slots: { 1: ['服药'], 2: ['早', '晚'], 3: ['早', '中', '晚'] },
      perDayOpt: n => '每天 ' + n + ' 次',
      calMed: (f, s) => '服药：' + f + '（' + s + '）', calFu: c => '中医复诊' + (c ? ' · ' + c : ''),
      tipsTitle: '注意',
      tips: ['用砂锅、陶瓷锅或不锈钢锅，不要用铁锅、铝锅。', '药液最好当天服完；放冰箱保存的，服前加热。', '服药后如果出现明显腹泻、皮疹、心慌等不适，请先停药并联系医生。', '以上是常规煎法，医生另有交代时以医嘱为准。'],
      wd: ['日', '一', '二', '三', '四', '五', '六'],
      fmtD: s => { const d = parseYmd(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; },
      fmtMD: s => { const d = parseYmd(s); return (d.getMonth() + 1) + '/' + d.getDate(); },
      sum: {
        title: '【复诊小结】', rx: '处方', from: '开方', took: (a, b, m) => '服药：已服 ' + a + ' / 应服 ' + b + ' 次' + (m ? '，漏服 ' + m + ' 次' : ''),
        start: s => s + ' 开始服药', feel: '每日感觉', log: '日记', gen: '—— 由「随诊本」生成', photos: n => '舌象照片 ' + n + ' 张'
      }
    },
    en: {
      tabToday: 'Today', tabRx: 'Herbs', tabDiary: 'Diary', tabMe: 'Me',
      hello: n => 'Hello' + (n ? ', ' + n : ''),
      weekday: s => parseYmd(s).toLocaleDateString('en-US', { weekday: 'long' }),
      notes: { '先煎': 'cook first', '后下': 'add late', '包煎': 'in a bag', '烊化': 'dissolve', '冲服': 'stir in', '另煎': 'cook separately', '打碎': 'crush' }, listSep: ', ',
      herbNamesNote: 'Herb names are kept in Chinese so the pharmacy can match them exactly.',
      g: {
        crush: j => 'Crush ' + j + ' before cooking.',
        bag: j => 'Put ' + j + ' into a cloth/gauze bag and tie it; cook it with the other herbs.',
        soak: ex => 'Put the herbs' + (ex ? ' (except ' + ex + ')' : '') + ' in the pot, add cold water 2–3 cm above the herbs and soak for 30 minutes.',
        pre: j => 'Cook ' + j + ' FIRST: bring to a boil, then simmer 30 minutes before adding the other herbs.',
        boil: 'Bring to a boil on high heat, then simmer gently on low heat for 20–30 minutes.',
        late: j => 'Add ' + j + ' only in the LAST 5–10 minutes.',
        second: 'Strain out the liquid. Add water again (just covering the herbs), boil and simmer 15–20 minutes for a second batch, then strain.',
        sep: j => 'Cook ' + j + ' separately in a small pot and add its liquid to the decoction.',
        mix: n => 'Mix both batches (about 300–400 ml) and drink warm' + (n === 1 ? ' in one serving.' : ', split into ' + n + ' servings.'),
        melt: j => 'Do not cook ' + j + ': put it in a cup and stir it into the hot decoction until dissolved.',
        stir: j => 'Do not cook ' + j + ': stir it into the warm decoction when drinking.'
      },
      noRxTitle: 'No prescription yet',
      noRxText: 'After your visit, your doctor will send you a prescription link. Open it and the prescription is saved here — with daily dose check-ins, how to cook the herbs, and your follow-up date.',
      demo: 'See an example', demoTag: 'Example',
      courseDay: (n, m) => 'Day ' + n + ' of ' + m,
      upcoming: d => 'Starts ' + d,
      courseDone: 'Course finished',
      takenOf: (a, b) => a + ' / ' + b + ' doses taken',
      guide: 'How to cook', timer: 'Cooking timer',
      followUp: 'Follow-up visit', fuIn: n => 'in ' + n + (n === 1 ? ' day' : ' days'), fuToday: 'Today', fuPast: n => n + (n === 1 ? ' day' : ' days') + ' ago', fuNone: 'No follow-up date from your doctor. You can set one in the prescription.',
      toCal: 'Add to calendar', summary: 'Visit summary',
      howFeel: 'How do you feel today?', moreDiary: 'Write more',
      saved: 'Saved',
      feel: ['Awful', 'Poor', 'Okay', 'Good', 'Great'],
      sleep: 'Sleep', appetite: 'Appetite', stool: 'Bowels',
      gfp: { g: 'Good', f: 'Fair', p: 'Poor' },
      stoolOpts: { n: 'Normal', d: 'Hard', l: 'Loose', x: 'None' },
      noteLabel: 'Anything else (changes, discomfort)', notePh: 'e.g. Less bloating, still some acid after meals',
      tongue: 'Tongue photo', tongueTip: 'Use daylight, stick your tongue out relaxed. Avoid right after eating or colored drinks.', addPhoto: 'Take / choose photo',
      trend: 'Last 14 days', noData: 'Nothing logged yet',
      dosesOn: 'Doses that day',
      rxList: 'My prescriptions', rxEmpty: 'No prescription yet',
      status: { active: 'Taking', upcoming: 'Not started', done: 'Finished' },
      herbsN: (n, k) => n + ' herbs × ' + k + (k === 1 ? ' pack' : ' packs'),
      usage: 'How to take', advice: "Doctor's advice", dx: 'Diagnosis', doctor: 'Doctor', date: 'Prescribed', patient: 'Patient',
      courseSet: 'Course', startDate: 'Start date', perDay: 'Times per day', fuDate: 'Follow-up date',
      remind: 'Add dose reminders to calendar', del: 'Delete prescription', delConfirm: 'Delete this prescription? Its dose check-ins will be removed (diary is kept).',
      back: '‹ Back',
      newRx: 'New prescription received', updRx: 'This prescription was updated', saveRx: 'Save', cancel: 'Cancel', ok: 'OK',
      badLink: 'This prescription link is incomplete or damaged. Please ask your doctor to send it again.',
      oldBrowser: 'Your browser is too old to open this prescription. Please update it or use Chrome / Safari.',
      myName: 'My name', lang: 'Language 语言', times: 'Reminder times',
      backup: 'Backup', exportB: 'Export backup file', importB: 'Restore from backup', clear: 'Erase all data',
      clearConfirm: 'Erase all prescriptions and diary entries? This cannot be undone.', importConfirm: 'Replace all current data with this backup?', importOk: 'Restored', importBad: 'Not a Care Notebook backup file',
      install: 'Install on your phone',
      installIOS: 'iPhone: open in Safari → tap Share → "Add to Home Screen"',
      installAndroid: 'Android: open in Chrome → ⋮ menu → "Add to Home screen" / "Install app"',
      installBtn: 'Install', installed: 'Installed — open it from your home screen like an app.',
      wechat: 'Data may be lost inside WeChat. Tap "···" (top right) → "Open in Browser", then add it to your home screen.',
      privacy: 'Your prescriptions and diary stay on this phone only and are never uploaded. Export a backup before switching phones.',
      disclaimer: 'For record-keeping and reminders only — not a substitute for medical care. If you feel clearly unwell while taking herbs, stop and contact your doctor.',
      copy: 'Copy', share: 'Send to doctor', copied: 'Copied — paste it into a message to your doctor',
      sumHint: 'Send this summary to your doctor before your follow-up visit.', sumNoRx: 'No prescription yet, nothing to summarize.',
      timerHint: 'Keep this page open. It will ring and vibrate when time is up.', timerDone: "Time's up!", timerRun: 'Cooking timer', stop: 'Stop', view: 'View', min: 'min',
      presets: [[30, 'Soak / cook first'], [25, '1st boil'], [15, '2nd boil'], [8, 'Add late']],
      slots: { 1: ['Dose'], 2: ['Morning', 'Evening'], 3: ['Morning', 'Midday', 'Evening'] },
      perDayOpt: n => n + (n === 1 ? ' time a day' : ' times a day'),
      calMed: (f, s) => 'Take herbs: ' + f + ' (' + s + ')', calFu: c => 'Chinese medicine follow-up' + (c ? ' · ' + c : ''),
      tipsTitle: 'Notes',
      tips: ['Use a clay, ceramic or stainless-steel pot — not iron or aluminium.', 'Finish the decoction the same day; if refrigerated, warm it before drinking.', 'If you get marked diarrhoea, a rash or palpitations, stop and contact your doctor.', 'This is the standard method — always follow your doctor if they said otherwise.'],
      wd: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      fmtD: s => parseYmd(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fmtMD: s => { const d = parseYmd(s); return (d.getMonth() + 1) + '/' + d.getDate(); },
      sum: {
        title: '[Follow-up summary]', rx: 'Prescription', from: 'prescribed', took: (a, b, m) => 'Doses: ' + a + ' of ' + b + ' taken' + (m ? ', ' + m + ' missed' : ''),
        start: s => 'started ' + s, feel: 'Daily feeling', log: 'Diary', gen: '— from Care Notebook', photos: n => 'tongue photo ×' + n
      }
    },
    ms: {
      tabToday: 'Hari ini', tabRx: 'Herba', tabDiary: 'Diari', tabMe: 'Saya',
      hello: n => 'Hai' + (n ? ', ' + n : ''),
      weekday: s => MS_DAY[parseYmd(s).getDay()],
      notes: { '先煎': 'rebus dahulu', '后下': 'masuk kemudian', '包煎': 'dalam uncang', '烊化': 'larutkan', '冲服': 'kacau masuk', '另煎': 'rebus berasingan', '打碎': 'tumbuk' }, listSep: ', ',
      herbNamesNote: 'Nama herba dikekalkan dalam bahasa Cina supaya kedai ubat dapat memadankannya dengan tepat.',
      g: {
        crush: j => 'Tumbuk ' + j + ' sebelum direbus.',
        bag: j => 'Masukkan ' + j + ' ke dalam uncang kain/kasa dan ikat; rebus bersama herba lain.',
        soak: ex => 'Masukkan herba' + (ex ? ' (kecuali ' + ex + ')' : '') + ' ke dalam periuk, tambah air sejuk 2–3 cm di atas paras herba dan rendam selama 30 minit.',
        pre: j => 'Rebus ' + j + ' DAHULU: didihkan, kemudian reneh 30 minit sebelum memasukkan herba lain.',
        boil: 'Didihkan dengan api besar, kemudian reneh perlahan dengan api kecil selama 20–30 minit.',
        late: j => 'Masukkan ' + j + ' hanya pada 5–10 minit TERAKHIR.',
        second: 'Tapis air rebusan. Tambah air semula (sekadar menutupi herba), didihkan dan reneh 15–20 minit untuk rebusan kedua, kemudian tapis.',
        sep: j => 'Rebus ' + j + ' secara berasingan dalam periuk kecil, kemudian campurkan airnya ke dalam air rebusan.',
        mix: n => 'Campurkan kedua-dua rebusan (kira-kira 300–400 ml) dan minum suam' + (n === 1 ? ' sekali gus.' : ', dibahagikan kepada ' + n + ' kali.'),
        melt: j => 'Jangan rebus ' + j + ': letakkan dalam cawan dan kacau dengan air rebusan panas sehingga larut.',
        stir: j => 'Jangan rebus ' + j + ': kacau ke dalam air rebusan suam semasa diminum.'
      },
      noRxTitle: 'Belum ada preskripsi',
      noRxText: 'Selepas rawatan, doktor akan menghantar pautan preskripsi kepada anda. Buka pautan itu dan preskripsi akan disimpan di sini — bersama semakan dos harian, cara merebus herba dan tarikh temujanji susulan.',
      demo: 'Lihat contoh', demoTag: 'Contoh',
      courseDay: (n, m) => 'Hari ' + n + ' daripada ' + m,
      upcoming: d => 'Bermula ' + d,
      courseDone: 'Kursus rawatan selesai',
      takenOf: (a, b) => a + ' / ' + b + ' dos diambil',
      guide: 'Cara merebus', timer: 'Pemasa rebusan',
      followUp: 'Temujanji susulan', fuIn: n => n + ' hari lagi', fuToday: 'Hari ini', fuPast: n => n + ' hari lalu', fuNone: 'Doktor tidak menetapkan tarikh susulan. Anda boleh menetapkannya dalam preskripsi.',
      toCal: 'Tambah ke kalendar', summary: 'Ringkasan untuk doktor',
      howFeel: 'Bagaimana perasaan anda hari ini?', moreDiary: 'Tulis lagi',
      saved: 'Disimpan',
      feel: ['Sangat teruk', 'Kurang baik', 'Biasa', 'Baik', 'Sangat baik'],
      sleep: 'Tidur', appetite: 'Selera makan', stool: 'Buang air besar',
      gfp: { g: 'Baik', f: 'Sederhana', p: 'Kurang' },
      stoolOpts: { n: 'Normal', d: 'Keras', l: 'Cair', x: 'Tiada' },
      noteLabel: 'Lain-lain (perubahan simptom, rasa tidak selesa)', notePh: 'cth. Perut kurang kembung, masih sedikit pedih ulu hati selepas makan',
      tongue: 'Foto lidah', tongueTip: 'Ambil dalam cahaya siang dan julurkan lidah dengan santai. Elakkan sejurus selepas makan atau minum minuman berwarna.', addPhoto: 'Ambil / pilih foto',
      trend: '14 hari lepas', noData: 'Belum ada rekod',
      dosesOn: 'Dos pada hari itu',
      rxList: 'Preskripsi saya', rxEmpty: 'Belum ada preskripsi',
      status: { active: 'Sedang diambil', upcoming: 'Belum bermula', done: 'Selesai' },
      herbsN: (n, k) => n + ' herba × ' + k + ' bungkus',
      usage: 'Cara pengambilan', advice: 'Nasihat doktor', dx: 'Diagnosis', doctor: 'Doktor', date: 'Tarikh preskripsi', patient: 'Pesakit',
      courseSet: 'Kursus rawatan', startDate: 'Tarikh mula', perDay: 'Berapa kali sehari', fuDate: 'Tarikh susulan',
      remind: 'Tambah peringatan dos ke kalendar', del: 'Padam preskripsi ini', delConfirm: 'Padam preskripsi ini? Rekod dos akan dipadam (diari dikekalkan).',
      back: '‹ Kembali',
      newRx: 'Preskripsi baharu diterima', updRx: 'Preskripsi ini telah dikemas kini', saveRx: 'Simpan', cancel: 'Batal', ok: 'OK',
      badLink: 'Pautan preskripsi ini tidak lengkap atau rosak. Sila minta doktor menghantarnya semula.',
      oldBrowser: 'Pelayar anda terlalu lama untuk membuka preskripsi ini. Sila kemas kini atau gunakan Chrome / Safari.',
      myName: 'Nama saya', lang: 'Bahasa · 语言 · Language', times: 'Masa peringatan',
      backup: 'Sandaran', exportB: 'Eksport fail sandaran', importB: 'Pulihkan daripada sandaran', clear: 'Padam semua data',
      clearConfirm: 'Padam semua preskripsi dan diari? Tindakan ini tidak boleh dibatalkan.', importConfirm: 'Gantikan semua data semasa dengan sandaran ini?', importOk: 'Dipulihkan', importBad: 'Ini bukan fail sandaran Care Notebook',
      install: 'Pasang pada telefon',
      installIOS: 'iPhone: buka dalam Safari → ketik Kongsi → "Tambah ke Skrin Utama"',
      installAndroid: 'Android: buka dalam Chrome → menu ⋮ → "Tambah ke skrin utama" / "Pasang aplikasi"',
      installBtn: 'Pasang', installed: 'Sudah dipasang — buka dari skrin utama seperti aplikasi biasa.',
      wechat: 'Data mungkin hilang jika dibuka dalam WeChat. Ketik "···" (atas kanan) → "Buka dalam pelayar", kemudian tambah ke skrin utama.',
      privacy: 'Preskripsi dan diari anda hanya disimpan dalam telefon ini dan tidak dimuat naik ke mana-mana pelayan. Eksport sandaran sebelum menukar telefon.',
      disclaimer: 'Untuk rekod dan peringatan sahaja — bukan pengganti rawatan doktor. Jika anda berasa tidak sihat semasa mengambil herba, hentikan dan hubungi doktor anda.',
      copy: 'Salin', share: 'Hantar kepada doktor', copied: 'Disalin — tampal dalam mesej kepada doktor anda',
      sumHint: 'Hantar ringkasan ini kepada doktor sebelum temujanji susulan.', sumNoRx: 'Belum ada preskripsi, tiada apa untuk diringkaskan.',
      timerHint: 'Biarkan halaman ini terbuka. Ia akan berbunyi dan bergetar apabila masa tamat.', timerDone: 'Masa tamat!', timerRun: 'Pemasa rebusan', stop: 'Henti', view: 'Lihat', min: 'minit',
      presets: [[30, 'Rendam / rebus dahulu'], [25, 'Rebusan pertama'], [15, 'Rebusan kedua'], [8, 'Masuk kemudian']],
      slots: { 1: ['Dos'], 2: ['Pagi', 'Malam'], 3: ['Pagi', 'Tengah hari', 'Malam'] },
      perDayOpt: n => n + ' kali sehari',
      calMed: (f, s) => 'Makan ubat herba: ' + f + ' (' + s + ')', calFu: c => 'Temujanji susulan perubatan Cina' + (c ? ' · ' + c : ''),
      tipsTitle: 'Perhatian',
      tips: ['Gunakan periuk tanah liat, seramik atau keluli tahan karat — bukan besi atau aluminium.', 'Habiskan air rebusan pada hari yang sama; jika disimpan dalam peti sejuk, panaskan sebelum diminum.', 'Jika anda cirit-birit teruk, ruam atau berdebar-debar, hentikan dan hubungi doktor anda.', 'Ini cara rebusan biasa — sentiasa ikut arahan doktor jika berbeza.'],
      wd: ['A', 'I', 'S', 'R', 'K', 'J', 'S'],
      fmtD: s => { const d = parseYmd(s); return d.getDate() + ' ' + MS_MON[d.getMonth()]; },
      fmtMD: s => { const d = parseYmd(s); return d.getDate() + '/' + (d.getMonth() + 1); },
      sum: {
        title: '[Ringkasan susulan]', rx: 'Preskripsi', from: 'ditetapkan', took: (a, b, m) => 'Dos: ' + a + ' daripada ' + b + ' diambil' + (m ? ', ' + m + ' tertinggal' : ''),
        start: s => 'bermula ' + s, feel: 'Perasaan harian', log: 'Diari', gen: '— daripada Care Notebook', photos: n => 'foto lidah ×' + n
      }
    }
  };

  /* ---------- 日期 ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => ymd(new Date());
  function parseYmd(s) { const a = String(s).split('-').map(Number); return new Date(a[0], a[1] - 1, a[2]); }
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);
  const isYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

  /* ---------- 存储：IndexedDB（kv: db；photos: 照片 Blob），不可用时退回 localStorage ---------- */
  let idb = null, db = null;
  const LS = 'care-notebook-v1';
  function openIdb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('care-notebook', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('photos'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  function req(store, mode, fn) {
    return new Promise((res, rej) => {
      const x = idb.transaction(store, mode), r = fn(x.objectStore(store));
      x.oncomplete = () => res(r && r.result); x.onerror = () => rej(x.error); x.onabort = () => rej(x.error);
    });
  }
  const memPhotos = new Map();
  const photoPut = (id, blob) => idb ? req('photos', 'readwrite', s => s.put(blob, id)) : (memPhotos.set(id, blob), Promise.resolve());
  const photoGet = id => idb ? req('photos', 'readonly', s => s.get(id)) : Promise.resolve(memPhotos.get(id));
  const photoDel = id => idb ? req('photos', 'readwrite', s => s.delete(id)) : (memPhotos.delete(id), Promise.resolve());
  const photoAll = () => idb ? req('photos', 'readonly', s => s.getAllKeys()) : Promise.resolve(Array.from(memPhotos.keys()));
  // lang 为空 = 第一次打开，先让患者自己选语言
  const blank = () => ({ v: 1, lang: '', name: '', times: ['08:30', '13:00', '20:00'], rxs: [], logs: {}, timer: null });
  async function load() {
    try { idb = await openIdb(); db = await req('kv', 'readonly', s => s.get('db')); } catch (e) { idb = null; }
    if (!db) { try { db = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { db = null; } }
    db = Object.assign(blank(), db || {});
  }
  let saving = Promise.resolve();
  function save() {
    const snap = JSON.parse(JSON.stringify(db));
    saving = saving.then(() => idb ? req('kv', 'readwrite', s => s.put(snap, 'db')) : localStorage.setItem(LS, JSON.stringify(snap))).catch(e => toast('保存失败 / Save failed: ' + e.message));
    return saving;
  }

  const L = () => I[db.lang] || I.zh;
  const t = (k, ...a) => { const v = L()[k]; return typeof v === 'function' ? v(...a) : v; };

  /* ---------- 处方：解析服法、疗程 ---------- */
  function parseUsage(u) {
    u = u || '';
    const perDay = /早中晚|[分日]\s*[3三]\s*次|每[日天]\s*[3三]\s*次/.test(u) ? 3 : /顿服|[日天]\s*[1一]\s*次|每晚|睡前/.test(u) ? 1 : 2;
    const every = /[2两二]\s*[日天]\s*[1一]\s*剂|隔日/.test(u) ? 2 : 1;
    return { perDay, every };
  }
  const courseDays = rx => Math.max(1, (Number(rx.doses) || 1) * (rx.every || 1));
  const endOf = rx => addDays(rx.start, courseDays(rx) - 1);
  function statusOf(rx, d) {
    d = d || today();
    if (d < rx.start) return 'upcoming';
    if (d > endOf(rx)) return 'done';
    return 'active';
  }
  function current() {
    const d = today(), list = db.rxs.slice().sort((a, b) => b.start.localeCompare(a.start) || String(b.recv).localeCompare(String(a.recv)));
    return list.find(r => statusOf(r, d) === 'active') || list.filter(r => statusOf(r, d) === 'upcoming').sort((a, b) => a.start.localeCompare(b.start))[0] || list[0] || null;
  }
  const R = id => db.rxs.find(r => r.id === id);
  const logOf = d => db.logs[d] || (db.logs[d] = {});
  const takenArr = (rx, d) => { const lg = db.logs[d], a = lg && lg.taken && lg.taken[rx.id]; return Array.from({ length: rx.perDay }, (_, i) => !!(a && a[i])); };
  function tally(rx, until) {
    const end = endOf(rx), last = until < end ? until : end;
    let due = 0, got = 0;
    // 今天还没到的次数不算漏服：今天只把已服的计入应服
    for (let d = rx.start; d <= last; d = addDays(d, 1)) { const g = takenArr(rx, d).filter(Boolean).length; got += g; due += d < until ? rx.perDay : g; }
    return { due, got, total: courseDays(rx) * rx.perDay };
  }
  const slotNames = rx => L().slots[rx.perDay] || L().slots[2];
  const herbNote = n => n ? (L().notes[n] || n) : '';
  const latin = () => db.lang !== 'zh';  // 英文、马来文用半角标点

  /* ---------- 处方链接解码 ---------- */
  const b64uDec = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  async function decodeRx(code) {
    const kind = code[0], bytes = b64uDec(decodeURIComponent(code.slice(1)));
    let raw;
    if (kind === 'z') {
      if (!window.DecompressionStream) throw new Error('old');
      raw = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    } else if (kind === 'j') raw = bytes;
    else throw new Error('bad');
    return JSON.parse(new TextDecoder().decode(raw));
  }
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  function cleanRx(o) {
    if (!o || o.v !== 1 || !o.id || !Array.isArray(o.h)) throw new Error('bad');
    const date = isNaN(Date.parse(o.d)) ? new Date().toISOString() : new Date(o.d).toISOString();
    return {
      id: str(o.id, 60), sent: Number(o.t) || Date.now(), date,
      clinic: str(o.c, 40), doctor: str(o.dr, 20), name: str(o.n, 20), dx: str(o.dx, 80),
      formula: str(o.f, 40), doses: Math.min(90, Math.max(1, parseInt(o.k, 10) || 7)), usage: str(o.u, 80), advice: str(o.a, 500),
      next: isYmd(o.nx) ? o.nx : '',
      herbs: o.h.slice(0, 60).map(h => ({ name: str(h[0], 16), dose: h[1] === '' || h[1] == null ? '' : str(h[1], 6), unit: str(h[2] || 'g', 4), note: str(h[3], 6) })).filter(h => h.name)
    };
  }

  /* ---------- 视图 ---------- */
  const view = $('#view');
  let route = 'today';
  function go(h) { if (location.hash !== '#' + h) location.hash = h; else render(); }
  function render() {
    const h = (location.hash || '#today').slice(1);
    if (h.indexOf('rx=') === 0) return;
    const [r, a] = h.split('/');
    route = r || 'today';
    document.body.classList.toggle('pick', !db.lang);
    if (!db.lang) { view.innerHTML = vPick(); renderBanner(); return; }
    document.documentElement.lang = db.lang === 'zh' ? 'zh-CN' : db.lang;
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    document.querySelectorAll('#tabs a').forEach(el => el.classList.toggle('on', el.dataset.tab === route));
    const html = route === 'rx' ? (a && R(a) ? vRxDetail(R(a)) : vRxList())
      : route === 'diary' ? vDiary(isYmd(a) && a <= today() ? a : today())
        : route === 'me' ? vMe()
          : vToday();
    view.innerHTML = html + '<p class="disclaimer">' + esc(t('disclaimer')) + '</p>';
    hydratePhotos();
    renderBanner();
    if (h !== lastH) { lastH = h; window.scrollTo(0, 0); }
  }
  let lastH = '';

  const seal = (c, cls) => '<span class="seal' + (cls ? ' ' + cls : '') + '">' + c + '</span>';
  const fmtD = s => L().fmtD(s);
  const dateOfIso = iso => ymd(new Date(iso));

  function vToday() {
    const d = today(), rx = current();
    let h = '<header class="head">' + seal('随') + '<div><h1>' + esc(t('hello', db.name)) + '</h1><p class="sub">' + fmtD(d) + ' · ' + esc(L().weekday(d)) + '</p></div></header>';
    if (!rx) {
      return h + '<section class="card empty">' + seal('方') + '<h2 style="justify-content:center">' + esc(t('noRxTitle')) + '</h2><p class="muted">' + esc(t('noRxText')) + '</p><div class="acts"><button class="btn primary" data-act="demo">' + esc(t('demo')) + '</button></div></section>';
    }
    const st = statusOf(rx, d), days = courseDays(rx), n = diffDays(rx.start, d) + 1, tl = tally(rx, d);
    h += '<section class="card hero"><h2>' + esc(rx.formula || '—') + (rx.demo ? ' <span class="tag">' + esc(t('demoTag')) + '</span>' : '') + '<small>' + esc(st === 'active' ? t('courseDay', n, days) : st === 'upcoming' ? t('upcoming', fmtD(rx.start)) : t('courseDone')) + '</small></h2>' +
      '<div class="bar"><i style="width:' + Math.round(100 * tl.got / tl.total) + '%"></i></div><p class="muted" style="margin:0">' + esc(t('takenOf', tl.got, tl.total)) + '</p>' +
      (st === 'active' ? '<div class="doses">' + doseButtons(rx, d) + '</div>' : '') +
      '<div class="acts"><a class="btn" href="#rx/' + esc(rx.id) + '">' + esc(t('guide')) + '</a><button class="btn" data-act="timer">' + esc(t('timer')) + '</button></div></section>';
    h += '<section class="card"><h2>' + esc(t('followUp')) + (rx.next ? '<small>' + fmtD(rx.next) + '</small>' : '') + '</h2>';
    if (rx.next) {
      const k = diffDays(d, rx.next);
      h += '<p class="big" style="color:' + (k <= 1 && k >= 0 ? 'var(--zhu)' : 'var(--dai)') + '">' + esc(k > 0 ? t('fuIn', k) : k === 0 ? t('fuToday') : t('fuPast', -k)) + '</p>' +
        (rx.clinic || rx.doctor ? '<p class="muted">' + esc([rx.clinic, rx.doctor].filter(Boolean).join(' · ')) + '</p>' : '');
    } else h += '<p class="muted">' + esc(t('fuNone')) + '</p>';
    h += '<div class="acts">' + (rx.next ? '<button class="btn" data-act="ics-fu" data-id="' + esc(rx.id) + '">' + esc(t('toCal')) + '</button>' : '') + '<button class="btn zhu" data-act="summary">' + esc(t('summary')) + '</button></div></section>';
    const lg = db.logs[d] || {};
    h += '<section class="card"><h2>' + esc(t('howFeel')) + '</h2>' + faces(lg.feel, d) + '<div class="acts"><a class="btn ghost" href="#diary/' + d + '">' + esc(t('moreDiary')) + ' ›</a></div></section>';
    return h;
  }
  function doseButtons(rx, d) {
    const a = takenArr(rx, d), names = slotNames(rx);
    return a.map((on, i) => '<button class="dose' + (on ? ' on' : '') + '" data-act="dose" data-id="' + esc(rx.id) + '" data-d="' + d + '" data-i="' + i + '"><b>' + (on ? '✓ ' : '') + esc(names[i]) + '</b><span>' + esc(db.times[rx.perDay === 1 ? 2 : rx.perDay === 2 ? [0, 2][i] : i] || '') + '</span></button>').join('');
  }
  const FACE = ['😣', '🙁', '😐', '🙂', '😄'];
  const faces = (v, d) => '<div class="faces">' + FACE.map((f, i) => '<button class="face' + (v === i + 1 ? ' on' : '') + '" data-act="feel" data-d="' + d + '" data-v="' + (i + 1) + '"><i>' + f + '</i><span>' + esc(L().feel[i]) + '</span></button>').join('') + '</div>';

  function vRxList() {
    const list = db.rxs.slice().sort((a, b) => b.start.localeCompare(a.start));
    let h = '<header class="head">' + seal('方') + '<div><h1>' + esc(t('rxList')) + '</h1></div></header>';
    if (!list.length) return h + '<section class="card empty"><p class="muted">' + esc(t('noRxText')) + '</p><div class="acts"><button class="btn primary" data-act="demo">' + esc(t('demo')) + '</button></div></section>';
    return h + '<section class="card list">' + list.map(r => {
      const st = statusOf(r);
      return '<a class="item" href="#rx/' + esc(r.id) + '"><div class="grow"><b>' + esc(r.formula || '—') + '</b><span class="muted">' + fmtD(dateOfIso(r.date)) + (r.doctor ? ' · ' + esc(r.doctor) : '') + ' · ' + esc(t('herbsN', r.herbs.length, r.doses)) + '</span></div><span class="tag' + (st === 'active' ? ' zhu' : st === 'done' ? ' ok' : '') + '">' + esc(L().status[st]) + '</span><span class="chev">›</span></a>';
    }).join('') + '</section>';
  }

  function guideSteps(rx) {
    const by = n => rx.herbs.filter(h => h.note === n).map(h => h.name);
    const j = a => a.join(L().listSep), G = L().g, s = [];
    const pre = by('先煎'), late = by('后下'), bag = by('包煎'), melt = by('烊化'), stir = by('冲服'), sep = by('另煎'), crush = by('打碎');
    const notInPot = melt.concat(stir, sep);
    // [是否重点步骤, 文字]
    if (crush.length) s.push([0, G.crush(j(crush))]);
    if (bag.length) s.push([1, G.bag(j(bag))]);
    s.push([0, G.soak(notInPot.length ? j(notInPot) : '')]);
    if (pre.length) s.push([1, G.pre(j(pre))]);
    s.push([0, G.boil]);
    if (late.length) s.push([1, G.late(j(late))]);
    s.push([0, G.second]);
    if (sep.length) s.push([1, G.sep(j(sep))]);
    s.push([0, G.mix(rx.perDay)]);
    if (melt.length) s.push([1, G.melt(j(melt))]);
    if (stir.length) s.push([1, G.stir(j(stir))]);
    return s;
  }

  function vRxDetail(rx) {
    let h = '<p><a class="btn ghost sm" href="#rx">' + esc(t('back')) + '</a></p>';
    h += '<header class="head">' + seal('方') + '<div><h1>' + esc(rx.formula || '—') + '</h1><p class="sub">' + esc([rx.clinic, rx.doctor].filter(Boolean).join(' · ')) + (rx.demo ? ' <span class="tag">' + esc(t('demoTag')) + '</span>' : '') + '</p></div></header>';
    h += '<section class="card"><h2>' + esc(t('herbsN', rx.herbs.length, rx.doses)) + '<small>' + esc(t('date')) + ' ' + fmtD(dateOfIso(rx.date)) + '</small></h2><div class="herbs">' +
      rx.herbs.map(x => '<div class="herb"><b>' + esc(x.name) + '</b><span>' + esc(x.dose) + (x.dose !== '' ? esc(x.unit) : '') + '</span>' + (x.note ? '<br><em>' + esc(herbNote(x.note)) + '</em>' : '') + '</div>').join('') + '</div>' +
      (rx.usage ? '<h3>' + esc(t('usage')) + '</h3><p>' + esc(rx.usage) + '</p>' : '') +
      (rx.dx ? '<h3>' + esc(t('dx')) + '</h3><p>' + esc(rx.dx) + '</p>' : '') +
      (rx.advice ? '<h3>' + esc(t('advice')) + '</h3><p class="note info">' + esc(rx.advice) + '</p>' : '') +
      (rx.name ? '<p class="muted" style="margin-top:10px">' + esc(t('patient')) + (latin() ? ': ' : '：') + esc(rx.name) + '</p>' : '') + '</section>';
    h += '<section class="card"><h2>' + esc(t('guide')) + '<small><button class="btn sm" data-act="timer">' + esc(t('timer')) + '</button></small></h2><ol class="steps">' +
      guideSteps(rx).map(s => '<li' + (s[0] ? ' class="key"' : '') + '>' + esc(s[1]) + '</li>').join('') + '</ol>' +
      '<h3>' + esc(t('tipsTitle')) + '</h3><ul style="margin:0;padding-left:20px" class="muted">' + L().tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      (L().herbNamesNote ? '<p class="muted" style="margin-top:8px">' + esc(L().herbNamesNote) + '</p>' : '') + '</section>';
    h += '<section class="card"><h2>' + esc(t('courseSet')) + '</h2>' +
      '<label class="f"><span>' + esc(t('startDate')) + '</span><input type="date" data-rx="start" data-id="' + esc(rx.id) + '" value="' + rx.start + '"></label>' +
      '<label class="f"><span>' + esc(t('perDay')) + '</span><select data-rx="perDay" data-id="' + esc(rx.id) + '">' + [1, 2, 3].map(n => '<option value="' + n + '"' + (rx.perDay === n ? ' selected' : '') + '>' + esc(t('perDayOpt', n)) + '</option>').join('') + '</select></label>' +
      '<label class="f"><span>' + esc(t('fuDate')) + '</span><input type="date" data-rx="next" data-id="' + esc(rx.id) + '" value="' + (rx.next || '') + '"></label>' +
      '<div class="acts"><button class="btn" data-act="ics-med" data-id="' + esc(rx.id) + '">' + esc(t('remind')) + '</button>' + (rx.next ? '<button class="btn" data-act="ics-fu" data-id="' + esc(rx.id) + '">' + esc(t('toCal')) + '</button>' : '') + '</div>' +
      '<div class="acts"><button class="btn danger ghost" data-act="rx-del" data-id="' + esc(rx.id) + '">' + esc(t('del')) + '</button></div></section>';
    return h;
  }

  function vDiary(d) {
    const td = today(), lg = db.logs[d] || {};
    let h = '<header class="head">' + seal('记') + '<div><h1>' + esc(fmtD(d)) + '</h1><p class="sub">' + esc(t('tabDiary')) + '</p></div></header>';
    // 日历：最近 5 周
    const endSat = addDays(td, 6 - parseYmd(td).getDay());
    let cal = '<div class="cal">' + L().wd.map(w => '<div class="muted">' + esc(w) + '</div>').join('');
    for (let i = 34; i >= 0; i--) {
      const x = addDays(endSat, -i), l = db.logs[x], has = l && (l.feel || l.note || (l.photos && l.photos.length) || l.sleep || l.appetite || l.stool);
      cal += '<div class="d' + (x > td ? ' future' : '') + (x === d ? ' sel' : '') + (x === td ? ' today' : '') + (has ? ' has' : '') + '"' + (x <= td ? ' data-act="go" data-to="diary/' + x + '"' : '') + '><b>' + parseYmd(x).getDate() + '</b><i></i></div>';
    }
    h += '<section class="card">' + cal + '</div></section>';
    const doseRx = db.rxs.filter(r => statusOf(r, d) === 'active');
    h += '<section class="card"><h2>' + esc(t('howFeel')) + '</h2>' + faces(lg.feel, d) +
      seg('sleep', L().gfp, lg.sleep, d) + seg('appetite', L().gfp, lg.appetite, d) + seg('stool', L().stoolOpts, lg.stool, d) +
      '<label class="f"><span>' + esc(t('noteLabel')) + '</span><textarea data-log="note" data-d="' + d + '" placeholder="' + esc(t('notePh')) + '">' + esc(lg.note || '') + '</textarea></label>' +
      '<label class="f"><span>' + esc(t('tongue')) + '</span></label><p class="muted" style="margin-top:0">' + esc(t('tongueTip')) + '</p>' +
      '<div>' + (lg.photos || []).map(id => '<span class="photo"><img data-photo="' + esc(id) + '" alt=""><button data-act="photo-del" data-d="' + d + '" data-id="' + esc(id) + '" aria-label="delete">×</button></span> ').join('') + '</div>' +
      ((lg.photos || []).length < 3 ? '<label class="btn" style="margin-top:8px">' + esc(t('addPhoto')) + '<input type="file" accept="image/*" capture="environment" data-photo-add="' + d + '" hidden></label>' : '') + '</section>';
    if (doseRx.length) h += '<section class="card"><h2>' + esc(t('dosesOn')) + '</h2>' + doseRx.map(r => '<p class="muted" style="margin:0 0 6px">' + esc(r.formula) + '</p><div class="seg">' + takenArr(r, d).map((on, i) => '<button class="' + (on ? 'on' : '') + '" data-act="dose" data-id="' + esc(r.id) + '" data-d="' + d + '" data-i="' + i + '">' + (on ? '✓ ' : '') + esc(slotNames(r)[i]) + '</button>').join('') + '</div>').join('<div style="height:10px"></div>') + '</section>';
    h += '<section class="card"><h2>' + esc(t('trend')) + '</h2>' + spark(td) + '</section>';
    return h;
  }
  const seg = (k, opts, v, d) => '<label class="f"><span>' + esc(t(k)) + '</span></label><div class="seg">' + Object.keys(opts).map(o => '<button class="' + (v === o ? 'on' : '') + '" data-act="log" data-k="' + k + '" data-v="' + o + '" data-d="' + d + '">' + esc(opts[o]) + '</button>').join('') + '</div>';
  function spark(td) {
    const pts = [];
    for (let i = 13; i >= 0; i--) { const x = addDays(td, -i), l = db.logs[x]; pts.push({ x, v: l && l.feel }); }
    if (!pts.some(p => p.v)) return '<p class="muted">' + esc(t('noData')) + '</p>';
    const W = 320, H = 70, px = i => 10 + i * (W - 20) / 13, py = v => H - 10 - (v - 1) * (H - 20) / 4;
    let path = '', pen = false;
    pts.forEach((p, i) => { if (p.v) { path += (pen ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.v).toFixed(1); pen = true; } else pen = false; });
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><line x1="10" x2="' + (W - 10) + '" y1="' + py(3) + '" y2="' + py(3) + '" stroke="#E3DCCB" stroke-dasharray="3 3"/>' +
      '<path d="' + path + '" fill="none" stroke="#3E5866" stroke-width="2" vector-effect="non-scaling-stroke"/>' +
      pts.map((p, i) => p.v ? '<circle cx="' + px(i) + '" cy="' + py(p.v) + '" r="3.5" fill="' + (p.v <= 2 ? '#B8403F' : '#3E5866') + '"/>' : '').join('') + '</svg>' +
      '<div class="row muted" style="font-size:12px"><span>' + esc(L().fmtMD(pts[0].x)) + '</span><span class="grow"></span><span>' + esc(L().fmtMD(td)) + '</span></div>';
  }

  let installEvt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (route === 'me') render(); });
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  // 第一次打开：三种语言一起写，让患者自己选
  function vPick() {
    return '<section class="pick-lang">' + seal('随') + '<h1>随诊本 · Care Notebook</h1>' +
      '<p class="muted">请选择语言<br>Choose your language<br>Pilih bahasa anda</p>' +
      LANGS.map(l => '<button class="btn block" data-act="lang-pick" data-v="' + l[0] + '">' + esc(l[1]) + '</button>').join('') +
      '<p class="disclaimer">' + esc(I.zh.disclaimer) + '<br>' + esc(I.en.disclaimer) + '<br>' + esc(I.ms.disclaimer) + '</p></section>';
  }
  function vMe() {
    let h = '<header class="head">' + seal('我') + '<div><h1>' + esc(t('tabMe')) + '</h1></div></header>';
    h += '<section class="card"><label class="f" style="margin-top:0"><span>' + esc(t('myName')) + '</span><input type="text" maxlength="20" data-set="name" value="' + esc(db.name) + '"></label>' +
      '<label class="f"><span>' + esc(t('lang')) + '</span></label><div class="lang">' + LANGS.map(l => '<button data-act="lang" data-v="' + l[0] + '" class="' + (db.lang === l[0] ? 'on' : '') + '">' + esc(l[1]) + '</button>').join('') + '</div>' +
      '<label class="f"><span>' + esc(t('times')) + '</span></label><div class="times">' + db.times.map((x, i) => '<label>' + esc(L().slots[3][i]) + '<input type="time" data-time="' + i + '" value="' + esc(x) + '"></label>').join('') + '</div></section>';
    h += '<section class="card"><h2>' + esc(t('summary')) + '</h2><p class="muted">' + esc(t('sumHint')) + '</p><div class="acts"><button class="btn zhu" data-act="summary">' + esc(t('summary')) + '</button></div></section>';
    h += '<section class="card"><h2>' + esc(t('install')) + '</h2>' + (standalone() ? '<p class="muted">' + esc(t('installed')) + '</p>'
      : (installEvt ? '<div class="acts" style="margin-top:0"><button class="btn primary" data-act="install">' + esc(t('installBtn')) + '</button></div>' : '') + '<p class="muted">' + esc(t('installIOS')) + '</p><p class="muted">' + esc(t('installAndroid')) + '</p>') + '</section>';
    h += '<section class="card"><h2>' + esc(t('backup')) + '</h2><p class="note info">' + esc(t('privacy')) + '</p><div class="acts"><button class="btn" data-act="export">' + esc(t('exportB')) + '</button><label class="btn">' + esc(t('importB')) + '<input type="file" accept=".json,application/json" data-import hidden></label></div>' +
      '<div class="acts"><button class="btn danger ghost" data-act="clear">' + esc(t('clear')) + '</button></div></section>';
    return h;
  }

  /* ---------- 横幅：微信内打开提醒 / 计时中 ---------- */
  let hideWx = false;
  function renderBanner() {
    const b = $('#banner'), parts = [];
    if (/MicroMessenger/i.test(navigator.userAgent) && !hideWx) parts.push(esc(t('wechat')) + '<button data-act="hide-wx">×</button>');
    if (db.timer && db.timer.end > Date.now()) parts.push('⏱ ' + esc(t('timerRun')) + ' <b id="banner-clock">' + clock(db.timer.end - Date.now()) + '</b><button data-act="timer">' + esc(t('view')) + '</button>');
    b.innerHTML = parts.join('<br>');
  }

  /* ---------- 弹窗 / 提示 ---------- */
  let onClose = null;
  function modal(html, cb) { $('#modal-body').innerHTML = html; $('#modal').hidden = false; onClose = cb || null; }
  function closeModal() { $('#modal').hidden = true; $('#modal-body').innerHTML = ''; const f = onClose; onClose = null; if (f) f(); }
  let toastT;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); }
  function alertBox(msg) { modal('<p>' + esc(msg) + '</p><div class="acts"><button class="btn primary" data-act="close">' + esc(t('ok')) + '</button></div>'); }
  function confirmBox(msg, yes) { modal('<p>' + esc(msg) + '</p><div class="acts"><button class="btn" data-act="close">' + esc(t('cancel')) + '</button><button class="btn zhu" data-act="confirm-yes">' + esc(t('ok')) + '</button></div>'); confirmYes = yes; }
  let confirmYes = null;

  /* ---------- 收到处方 ---------- */
  let pending = null, heldRx = '';
  async function checkHash() {
    const h = location.hash;
    if (h.indexOf('#rx=') !== 0) return false;
    history.replaceState(null, '', location.pathname + location.search + '#today');
    // 还没选语言：先记住这张处方，选完语言再弹出
    if (!db.lang) { heldRx = h; render(); return true; }
    render();
    try { pending = cleanRx(await decodeRx(h.slice(4))); }
    catch (e) { alertBox(e.message === 'old' ? t('oldBrowser') : t('badLink')); return true; }
    const ex = R(pending.id), p = pending;
    const start = ex ? ex.start : today();
    modal('<h2>' + seal('方') + esc(ex ? t('updRx') : t('newRx')) + '</h2>' +
      '<p><b>' + esc(p.formula || '—') + '</b>　' + esc(t('herbsN', p.herbs.length, p.doses)) + '</p>' +
      '<p class="muted">' + esc([p.clinic, p.doctor, fmtD(dateOfIso(p.date))].filter(Boolean).join(' · ')) + (p.name ? '<br>' + esc(t('patient')) + (latin() ? ': ' : '：') + esc(p.name) : '') + '</p>' +
      '<label class="f"><span>' + esc(t('startDate')) + '</span><input type="date" id="imp-start" value="' + start + '"></label>' +
      '<div class="acts"><button class="btn" data-act="close">' + esc(t('cancel')) + '</button><button class="btn primary" data-act="import-save">' + esc(t('saveRx')) + '</button></div>');
    return true;
  }
  function importSave() {
    const p = pending; if (!p) return;
    const st = $('#imp-start').value, ex = R(p.id), u = parseUsage(p.usage);
    const rx = Object.assign({}, p, { start: isYmd(st) ? st : today(), perDay: ex ? ex.perDay : u.perDay, every: u.every, recv: new Date().toISOString() });
    db.rxs = db.rxs.filter(r => !r.demo);  // 收到真处方后，示例就不需要了
    if (ex) Object.assign(ex, rx); else db.rxs.push(rx);
    if (!db.name && p.name) db.name = p.name;
    pending = null; save(); closeModal(); toast(t('saved'));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    go('today');
  }
  function loadDemo() {
    const d = today();
    const herbs = [['柴胡', 12], ['白芍', 12], ['川芎', 9], ['香附', 9], ['陈皮', 9], ['枳壳', 9], ['炙甘草', 6], ['海螵蛸', 15], ['煅瓦楞子', 30, '先煎'], ['砂仁', 6, '后下']];
    db.rxs = db.rxs.filter(r => !r.demo);
    db.rxs.push({ id: 'demo', demo: true, sent: Date.now(), date: new Date().toISOString(), clinic: '示例中医门诊', doctor: '示例医师', name: '', dx: '胃痛 · 肝胃不和证', formula: '柴胡疏肝散加减', doses: 7, usage: '水煎服，每日 1 剂，早晚分温服', advice: '忌食生冷辛辣，调畅情志，规律进餐。7 日后复诊。', next: addDays(d, 7), herbs: herbs.map(x => ({ name: x[0], dose: String(x[1]), unit: 'g', note: x[2] || '' })), start: d, perDay: 2, every: 1, recv: new Date().toISOString() });
    save(); render();
  }

  /* ---------- 复诊小结 ---------- */
  function summaryText() {
    const rx = current(); if (!rx) return '';
    const S = L().sum, td = today(), en = latin();
    const tl = tally(rx, td);
    const lines = [S.title + (db.name ? ' ' + db.name : '')];
    lines.push(S.rx + (en ? ': ' : '：') + (rx.formula || '—') + (en ? ' (' : '（') + [rx.doctor, fmtD(dateOfIso(rx.date)) + ' ' + S.from].filter(Boolean).join(' ') + (en ? ')' : '）'));
    lines.push(S.took(tl.got, tl.due, tl.due - tl.got) + (en ? ' (' : '（') + S.start(fmtD(rx.start)) + (en ? ')' : '）'));
    const from = addDays(rx.start, -3), rows = [];
    for (let d = from; d <= td; d = addDays(d, 1)) {
      const l = db.logs[d]; if (!l) continue;
      const bits = [];
      if (l.feel) bits.push(L().feel[l.feel - 1]);
      if (l.sleep) bits.push(t('sleep') + (en ? ' ' : '') + L().gfp[l.sleep]);
      if (l.appetite) bits.push(t('appetite') + (en ? ' ' : '') + L().gfp[l.appetite]);
      if (l.stool) bits.push(t('stool') + (en ? ' ' : '') + L().stoolOpts[l.stool]);
      if (l.photos && l.photos.length) bits.push(S.photos(l.photos.length));
      if (l.note) bits.push(l.note.replace(/\s+/g, ' '));
      if (bits.length) rows.push(L().fmtMD(d) + ' ' + bits.join(en ? '; ' : '，'));
    }
    if (rows.length) { lines.push(''); lines.push(S.log + (en ? ':' : '：')); rows.forEach(r => lines.push(r)); }
    lines.push(''); lines.push(S.gen);
    return lines.join('\n');
  }
  function openSummary() {
    const txt = summaryText();
    if (!txt) { alertBox(t('sumNoRx')); return; }
    modal('<h2>' + esc(t('summary')) + '</h2><p class="muted">' + esc(t('sumHint')) + '</p><pre class="sum" id="sum-text">' + esc(txt) + '</pre>' +
      '<div class="acts"><button class="btn" data-act="close">' + esc(t('cancel')) + '</button><button class="btn" data-act="sum-copy">' + esc(t('copy')) + '</button>' + (navigator.share ? '<button class="btn zhu" data-act="sum-share">' + esc(t('share')) + '</button>' : '') + '</div>');
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } ta.remove(); return ok;
    }
  }

  /* ---------- 日历提醒（.ics） ---------- */
  const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const icsDT = (d, hm) => d.replace(/-/g, '') + (hm ? 'T' + hm.replace(':', '') + '00' : '');
  function downloadIcs(name, events) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Care Notebook//EN', 'CALSCALE:GREGORIAN'];
    events.forEach((e, i) => {
      out.push('BEGIN:VEVENT', 'UID:' + e.uid + '-' + i + '@care-notebook', 'DTSTAMP:' + stamp);
      if (e.allDay) out.push('DTSTART;VALUE=DATE:' + icsDT(e.date), 'DTEND;VALUE=DATE:' + icsDT(addDays(e.date, 1)));
      else out.push('DTSTART:' + icsDT(e.date, e.time), 'DURATION:PT10M');
      if (e.count) out.push('RRULE:FREQ=DAILY;COUNT=' + e.count);
      out.push('SUMMARY:' + icsEsc(e.title));
      if (e.desc) out.push('DESCRIPTION:' + icsEsc(e.desc));
      out.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:' + (e.allDay ? '-PT4H' : 'PT0M'), 'END:VALARM', 'END:VEVENT');
    });
    out.push('END:VCALENDAR');
    saveFile(name, new Blob([out.join('\r\n')], { type: 'text/calendar' }));
  }
  function saveFile(name, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function icsMed(rx) {
    const names = slotNames(rx), idx = rx.perDay === 1 ? [2] : rx.perDay === 2 ? [0, 2] : [0, 1, 2];
    const start = rx.start > today() ? rx.start : today(), count = diffDays(start, endOf(rx)) + 1;
    if (count < 1) { toast(t('courseDone')); return; }
    downloadIcs('herbs-reminder.ics', idx.map((ti, i) => ({ uid: rx.id + '-med', date: start, time: db.times[ti], count, title: t('calMed', rx.formula, names[i]), desc: rx.usage })));
  }
  function icsFu(rx) {
    if (!rx.next) return;
    downloadIcs('follow-up.ics', [{ uid: rx.id + '-fu', date: rx.next, allDay: true, title: t('calFu', rx.clinic), desc: [rx.doctor, rx.formula].filter(Boolean).join(' · ') }]);
  }

  /* ---------- 煎药计时 ---------- */
  const clock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
  let tick = null, wake = null, actx = null;
  function openTimer() {
    const run = db.timer && db.timer.end > Date.now();
    modal('<div class="timer"><h2 style="justify-content:center">' + esc(t('timer')) + '</h2><div class="clock" id="t-clock">' + (run ? clock(db.timer.end - Date.now()) : '00:00') + '</div>' +
      '<div class="presets">' + L().presets.map(p => '<button class="btn" data-act="t-start" data-m="' + p[0] + '"><span><b>' + p[0] + '</b> ' + esc(t('min')) + '<br><small class="muted">' + esc(p[1]) + '</small></span></button>').join('') + '</div>' +
      '<p class="muted">' + esc(t('timerHint')) + '</p><div class="acts"><button class="btn" data-act="close">' + esc(t('ok')) + '</button>' + (run ? '<button class="btn danger" data-act="t-stop">' + esc(t('stop')) + '</button>' : '') + '</div></div>');
  }
  function startTimer(min) {
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) { actx = null; }
    db.timer = { end: Date.now() + min * 60000 }; save();
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { wake = w; }).catch(() => {});
    openTimer(); renderBanner(); runTick();
  }
  function stopTimer(done) {
    db.timer = null; save();
    if (wake) { wake.release().catch(() => {}); wake = null; }
    if (done) {
      beep(); if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
      modal('<div class="timer"><div class="clock" style="color:var(--zhu)">' + esc(t('timerDone')) + '</div><div class="acts"><button class="btn primary" data-act="close">' + esc(t('ok')) + '</button></div></div>');
    } else if (!$('#modal').hidden && $('#t-clock')) openTimer();
    renderBanner();
  }
  function beep() {
    if (!actx) return;
    try {
      [0, .5, 1].forEach(off => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
        const t0 = actx.currentTime + off; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.4, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .4);
        o.start(t0); o.stop(t0 + .42);
      });
    } catch (e) { /* 无声音也不影响 */ }
  }
  function runTick() {
    clearInterval(tick);
    if (!db.timer) return;
    tick = setInterval(() => {
      if (!db.timer) { clearInterval(tick); return; }
      const left = db.timer.end - Date.now();
      const c = $('#t-clock'), bc = $('#banner-clock');
      if (c) c.textContent = clock(left); if (bc) bc.textContent = clock(left);
      if (left <= 0) { clearInterval(tick); stopTimer(true); }
    }, 500);
  }

  /* ---------- 照片 ---------- */
  const urls = new Map();
  function hydratePhotos() {
    document.querySelectorAll('img[data-photo]').forEach(img => {
      const id = img.dataset.photo;
      if (urls.has(id)) { img.src = urls.get(id); return; }
      photoGet(id).then(b => { if (b) { const u = URL.createObjectURL(b); urls.set(id, u); img.src = u; } });
    });
  }
  function compress(file) {
    return new Promise((res, rej) => {
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(b => b ? res(b) : rej(new Error('jpeg')), 'image/jpeg', .82);
      };
      img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('image')); };
      img.src = u;
    });
  }

  /* ---------- 备份 ---------- */
  const blobToData = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  async function exportBackup() {
    const photos = {};
    for (const id of await photoAll()) { const b = await photoGet(id); if (b) photos[id] = await blobToData(b); }
    saveFile('care-notebook-' + today() + '.json', new Blob([JSON.stringify({ app: 'care-notebook', v: 1, at: new Date().toISOString(), db, photos })], { type: 'application/json' }));
  }
  async function importBackup(file) {
    let o; try { o = JSON.parse(await file.text()); } catch (e) { o = null; }
    if (!o || o.app !== 'care-notebook' || !o.db || !Array.isArray(o.db.rxs)) { alertBox(t('importBad')); return; }
    confirmBox(t('importConfirm'), async () => {
      for (const id of await photoAll()) await photoDel(id);
      for (const id of Object.keys(o.photos || {})) { const b = await (await fetch(o.photos[id])).blob(); await photoPut(id, b); }
      db = Object.assign(blank(), o.db); urls.clear(); await save(); toast(t('importOk')); go('today');
    });
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]'); if (!el) { if (e.target.id === 'modal') closeModal(); return; }
    const a = el.dataset.act, id = el.dataset.id, d = el.dataset.d;
    if (a === 'go') go(el.dataset.to);
    else if (a === 'close') closeModal();
    else if (a === 'confirm-yes') { const f = confirmYes; confirmYes = null; closeModal(); if (f) f(); }
    else if (a === 'demo') loadDemo();
    else if (a === 'dose') {
      const rx = R(id); if (!rx) return;
      const lg = logOf(d); lg.taken = lg.taken || {}; const arr = takenArr(rx, d); arr[+el.dataset.i] = !arr[+el.dataset.i]; lg.taken[id] = arr;
      save(); render();
    } else if (a === 'feel') {
      const lg = logOf(d), v = +el.dataset.v; lg.feel = lg.feel === v ? 0 : v; save(); render(); toast(t('saved'));
    } else if (a === 'log') {
      const lg = logOf(d), k = el.dataset.k; lg[k] = lg[k] === el.dataset.v ? '' : el.dataset.v; save(); render();
    } else if (a === 'photo-del') {
      const lg = logOf(d); lg.photos = (lg.photos || []).filter(x => x !== id); await photoDel(id); save(); render();
    } else if (a === 'lang') { db.lang = el.dataset.v; save(); render(); }
    else if (a === 'lang-pick') {
      db.lang = el.dataset.v; save();
      if (heldRx) { const h = heldRx; heldRx = ''; history.replaceState(null, '', location.pathname + location.search + h); await checkHash(); }
      else render();
    }
    else if (a === 'summary') openSummary();
    else if (a === 'sum-copy') { if (await copyText(summaryText())) toast(t('copied')); }
    else if (a === 'sum-share') { try { await navigator.share({ text: summaryText() }); } catch (err) { /* 用户取消 */ } }
    else if (a === 'ics-med') { const rx = R(id); if (rx) icsMed(rx); }
    else if (a === 'ics-fu') { const rx = R(id); if (rx) icsFu(rx); }
    else if (a === 'timer') openTimer();
    else if (a === 't-start') startTimer(+el.dataset.m);
    else if (a === 't-stop') stopTimer(false);
    else if (a === 'import-save') importSave();
    else if (a === 'rx-del') confirmBox(t('delConfirm'), () => {
      db.rxs = db.rxs.filter(r => r.id !== id);
      Object.values(db.logs).forEach(l => { if (l.taken) delete l.taken[id]; });
      save(); go('rx');
    });
    else if (a === 'hide-wx') { hideWx = true; renderBanner(); }
    else if (a === 'install' && installEvt) { installEvt.prompt(); installEvt = null; }
    else if (a === 'export') exportBackup();
    else if (a === 'clear') confirmBox(t('clearConfirm'), async () => {
      for (const pid of await photoAll()) await photoDel(pid);
      const lang = db.lang; db = blank(); db.lang = lang; await save(); go('today');
    });
  });
  let noteT;
  document.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.log === 'note') { const lg = logOf(el.dataset.d); lg.note = el.value.slice(0, 2000); clearTimeout(noteT); noteT = setTimeout(save, 400); }
    else if (el.dataset.set === 'name') { db.name = el.value.trim().slice(0, 20); clearTimeout(noteT); noteT = setTimeout(save, 400); }
  });
  document.addEventListener('change', async e => {
    const el = e.target;
    if (el.dataset.rx) {
      const rx = R(el.dataset.id); if (!rx) return;
      const k = el.dataset.rx;
      if (k === 'start' && isYmd(el.value)) rx.start = el.value;
      else if (k === 'next') rx.next = isYmd(el.value) ? el.value : '';
      else if (k === 'perDay') rx.perDay = Math.min(3, Math.max(1, +el.value || 2));
      save(); render(); toast(t('saved'));
    } else if (el.dataset.time != null && /^\d{2}:\d{2}$/.test(el.value)) { db.times[+el.dataset.time] = el.value; save(); }
    else if (el.dataset.photoAdd && el.files && el.files[0]) {
      const d = el.dataset.photoAdd;
      try {
        const b = await compress(el.files[0]), pid = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await photoPut(pid, b); const lg = logOf(d); lg.photos = (lg.photos || []).concat(pid).slice(0, 3); save(); render(); toast(t('saved'));
      } catch (err) { toast(err.message); }
    } else if (el.hasAttribute('data-import') && el.files && el.files[0]) importBackup(el.files[0]);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  window.addEventListener('hashchange', async () => { if (!(await checkHash())) render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && db) { if (db.timer && db.timer.end <= Date.now()) stopTimer(true); else render(); } });

  /* ---------- 启动 ---------- */
  (async () => {
    await load();
    if (db.timer && db.timer.end <= Date.now()) db.timer = null;
    if (!(await checkHash())) render();
    runTick();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  })();
})();
