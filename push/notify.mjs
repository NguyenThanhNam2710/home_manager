// Gửi thông báo nhắc giờ. Chạy bởi GitHub Actions mỗi 5 phút (xem .github/workflows/nhac-gio.yml).
import admin from 'firebase-admin';

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
if (!sa.project_id) { console.error('Thiếu secret FIREBASE_SERVICE_ACCOUNT'); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const TZ = 'Asia/Ho_Chi_Minh';
const BEFORE = +(process.env.EARLY_MIN || 2);   // gửi sớm tối đa (phút)
const AFTER = +(process.env.LATE_MIN || 12);    // vẫn gửi nếu trễ tối đa (phút)

const now = new Date();
const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
const nowMin = +parts.hour * 60 + +parts.minute;
const mins = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };

const [daySnap, coreSnap, logSnap, devSnap] = await Promise.all([
  db.doc(`days/${dateKey}`).get(), db.doc('fam/core').get(), db.doc(`pushlog/${dateKey}`).get(), db.collection('push').get(),
]);
const tasks = (daySnap.exists ? daySnap.data().tasks || [] : []).filter(t => t.remind && !t.done && t.t);
const members = coreSnap.exists ? coreSnap.data().members || [] : [];
const hasAcct = Object.fromEntries(members.map(m => [m.id, !!m.acct]));
const sent = new Set(logSnap.exists ? logSnap.data().sent || [] : []);
const devices = devSnap.docs.map(d => ({ id: d.id, ...d.data() }));

const due = tasks.filter(t => {
  const d = mins(t.t) - nowMin;           // >0: còn bao lâu nữa; <0: đã trễ
  return d <= BEFORE && d >= -AFTER && !sent.has(t.id || `${t.t}|${t.name}`);
});
console.log(`${dateKey} ${parts.hour}:${parts.minute} · ${tasks.length} việc có nhắc · ${due.length} đến hạn · ${devices.length} máy`);

for (const t of due) {
  const key = t.id || `${t.t}|${t.name}`;
  const targets = devices.filter(d => !hasAcct[t.who] || d.who === t.who); // việc của bé (không có tài khoản) nhắc cả hai
  const name = members.find(m => m.id === t.who)?.n || '';
  for (const d of targets) {
    try {
      await admin.messaging().send({
        token: d.token,
        data: { title: `${t.t} · ${t.name}`, body: name ? `Việc của ${name}` : 'Đến giờ rồi', tag: key },
        webpush: { headers: { Urgency: 'high', TTL: '900' } },
      });
    } catch (e) {
      console.error('Gửi lỗi', d.id, e.code || e.message);
      if (/registration-token-not-registered|invalid-argument|invalid-registration/.test(e.code || '')) await db.doc(`push/${d.id}`).delete();
    }
  }
  sent.add(key);
  console.log('Đã nhắc', t.t, t.name, '→', targets.length, 'máy');
}
if (due.length) await db.doc(`pushlog/${dateKey}`).set({ sent: [...sent] });
