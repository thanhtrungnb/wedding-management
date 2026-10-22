/* DỮ LIỆU MẪU — chỉ để minh họa. Sau này thay bằng repository đọc từ LocalStorage. */
export const SAMPLE = {
  isSample: true,
  couple: { bride: 'Minh Anh', groom: 'Quốc Bảo' },
  weddingDate: '2027-03-14',
  categories: [
    { id:'venue', name:'Địa điểm & tiệc' }, { id:'photo', name:'Ảnh cưới' }, { id:'attire', name:'Trang phục' },
    { id:'family', name:'Lễ nghi & gia đình' }, { id:'guest', name:'Khách mời & thiệp' },
  ],
  owners: { bride:'Cô dâu', groom:'Chú rể', both:'Cả hai' },
  tasks: [
    { id:'t1', parentId:null, title:'Chốt nhà hàng tổ chức tiệc cưới', categoryId:'venue', due:'2026-10-19', priority:'high', owner:'both', done:false, note:'Đã xem hai nhà hàng; còn cần so sánh báo giá và hỏi lịch giữ chỗ.' },
    { id:'t1a', parentId:'t1', title:'Tham quan nhà hàng thứ hai', categoryId:'venue', due:'2026-10-12', priority:'medium', owner:'both', done:true },
    { id:'t1b', parentId:'t1', title:'So sánh báo giá hai nhà hàng', categoryId:'venue', due:'2026-10-22', priority:'high', owner:'both', done:false },
    { id:'t1c', parentId:'t1', title:'Đặt cọc giữ ngày', categoryId:'venue', due:'2026-10-30', priority:'high', owner:'groom', done:false },
    { id:'t2', parentId:null, title:'Lập danh sách khách mời hai họ', categoryId:'guest', due:'2026-10-25', priority:'medium', owner:'both', done:false },
    { id:'t2a', parentId:'t2', title:'Danh sách họ nhà gái', categoryId:'guest', due:'2026-10-20', priority:'medium', owner:'bride', done:true },
    { id:'t2b', parentId:'t2', title:'Danh sách họ nhà trai', categoryId:'guest', due:'2026-10-25', priority:'medium', owner:'groom', done:false },
    { id:'t3', parentId:null, title:'Chọn đơn vị chụp ảnh cưới', categoryId:'photo', due:'2026-10-28', priority:'high', owner:'both', done:false, note:'Sau khi chốt, hai bạn có thể lên lịch chụp vào tháng 12.' },
    { id:'t4', parentId:null, title:'Thử váy cưới lần đầu', categoryId:'attire', due:'2026-11-02', priority:'medium', owner:'bride', done:false },
    { id:'t5', parentId:null, title:'Bàn lễ ăn hỏi với hai gia đình', categoryId:'family', due:'2026-11-15', priority:'high', owner:'both', done:false },
    { id:'t6', parentId:null, title:'Đặt may vest cho chú rể', categoryId:'attire', due:'2026-12-01', priority:'medium', owner:'groom', done:false },
    { id:'t7', parentId:null, title:'Hẹn lịch dạm ngõ', categoryId:'family', due:'2026-09-20', priority:'high', owner:'both', done:true },
    { id:'t8', parentId:null, title:'Chọn nhẫn cưới', categoryId:'attire', due:'2026-09-30', priority:'medium', owner:'both', done:true },
    { id:'t9', parentId:null, title:'Thiết kế thiệp mời', categoryId:'guest', due:'2026-11-20', priority:'low', owner:'bride', done:false },
  ],
  milestones: [
    { id:'m1', title:'Chụp ảnh cưới', date:'2026-12-20' },
    { id:'m2', title:'Lễ ăn hỏi', date:'2027-03-06' },
    { id:'m3', title:'Tiệc cưới', date:'2027-03-14', big:true },
  ],
  budget: { /* planned = dự kiến; committed = đã chốt; paid = đã trả (VND nguyên) */
    income: [ { label:'Tiết kiệm của hai bạn', amount:200000000 }, { label:'Hai gia đình hỗ trợ', amount:150000000 }, { label:'Quà mừng dự kiến', amount:250000000 } ],
    items: [
      { id:'b1', name:'Tiệc cưới', planned:220000000, committed:0, paid:0 },
      { id:'b2', name:'Ảnh cưới', planned:45000000, committed:0, paid:0 },
      { id:'b3', name:'Trang phục & trang điểm', planned:60000000, committed:18000000, paid:18000000 },
      { id:'b4', name:'Trang trí', planned:35000000, committed:0, paid:0 },
      { id:'b5', name:'Nhẫn & trang sức', planned:50000000, committed:48000000, paid:48000000 },
      { id:'b6', name:'Lễ ăn hỏi & chi phí khác', planned:40000000, committed:0, paid:0 },
    ],
  },
};
