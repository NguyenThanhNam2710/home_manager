/* Dán thông tin dự án Firebase của bạn vào đây (xem HUONG-DAN.md, bước 3).
   Các giá trị này không phải mật khẩu; việc ai được đọc ghi dữ liệu do luật Firestore quyết định (firestore.rules). */
window.FAM_CONFIG={
  firebase:{
    apiKey:'AIzaSyAHkigVDCWRBPiBXMmr50EaL-qQoWFQzzw',
    authDomain:'homemanager-da6aa.firebaseapp.com',
    projectId:'homemanager-da6aa',
    appId:'1:1005110091768:web:c13b6fcbd57a5a3813c00d'
  },
  /* mã người dùng (User UID, xem ở Firebase > Authentication > Users) -> thành viên trong app.
     Dùng để tự chọn "Nam" hoặc "Nguyệt" khi đăng nhập. Dùng UID để không để lộ email trong mã trang. */
  viewers:{
    'NGPfT4s75ZRrLVYsyC8S9D41M8W2':'nam',
    'aItLdpzW4LQMBZEW25tet8AjBof1':'nguyet'
  }
};
