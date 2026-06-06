import { Product, Combo, BlogPost, Coupon, Order, ConsultationSchedule } from "./types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-01",
    name: "Sofa Da Bò Ý Tự Nhiên - Royal Signature",
    price: 68500000,
    rating: 4.9,
    category: "phong-khach",
    categoryName: "Phòng Khách",
    style: "Luxury",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Bộ ghế sofa phòng khách hoàng gia bọc da bò Ý nguyên tấm thượng hạng, nệm mút lông vũ siêu êm ái.",
    longDescription: "Sofa Royal Signature đại diện cho đỉnh cao nghệ thuật chế tác đồ gia dụng Ý. Sản phẩm sử dụng chất liệu da bò Full Grain chọn lọc nghiêm ngặt từ vùng Tuscany, trải qua quá trình thuộc da thảo mộc thảo dược tự nhiên giữ trọn vẹn sự mềm mại, thoáng khí. Toàn bộ khung gỗ được làm bằng gỗ Óc Chó sấy cao cấp chống mối mọt cong vênh. Phần đệm ngồi được gia cố kết hợp lò xo túi độc lập kết hợp mút nhũ tương foam mật độ cao và bề lớp lông vũ tự nhiên đem lại cảm giác êm sâu tinh tế vượt mong đợi.",
    material: "Khung gỗ Óc Chó (Walnut), Da Bò Ý Full Grain nhập khẩu, Đệm mút lông vũ cao cấp",
    dimensions: "Dài 260cm x Rộng 95cm x Cao 85cm",
    colors: ["Nâu Tan (Caramel)", "Đen Da Voi (Charcoal)", "Kem Sữa (Beige)"],
    features: ["Da chống bám bẩn", "Khung bảo hành trọn đời", "Tặng set gối tựa da cao cấp"],
    warranty: "10 năm đối với phần khung gỗ, 5 năm đối với phần da thuộc",
    stock: 12,
    brand: "Heritage Milano",
    reviews: [
      { id: "rev-1", author: "Phạm Minh Hoàng", rating: 5, comment: "Sofa cực kỳ đẹp, da sờ rất mướt và thơm mùi tự nhiên. Rất đáng đồng tiền bát gạo.", date: "2026-05-15" },
      { id: "rev-2", author: "Nguyễn Thuỳ Lâm", rating: 5, comment: "Dịch vụ giao hàng siêu chuyên nghiệp, nhân viên cẩn thận bọc kĩ càng rồi lắp ráp nhanh gọn lẹ.", date: "2026-05-20" }
    ]
  },
  {
    id: "prod-02",
    name: "Bàn Trà Đá Cẩm Thạch Carrara - Venice Golden Frame",
    price: 18500000,
    rating: 4.8,
    category: "phong-khach",
    categoryName: "Phòng Khách",
    style: "Modern",
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Bàn trà tinh khiết cổ điển kiểu Pháp bằng đá cẩm thạch trắng tự nhiên Carrara kết hợp chân inox mạ titan vàng champagne cao cấp.",
    longDescription: "Venice Golden Frame kết hợp hài hòa vẻ đẹp mỹ thuật cổ xưa và kết cấu kim loại cao cấp đương đại. Phiến đá cẩm thạch trắng mây Carrara nhập nguyên tấm từ phên mỏ cổ đại miền bắc nước Ý có hệ vân phóng khoáng độc bản, được mài bóng satin mịn bảo vệ tuyệt hảo khỏi vết trà, nước ép. Khung xương inox AISI 304 cứng cáp, xử lý bóng gương và thổi mạ chân không PVD màu vàng Champagne óng ánh tăng vẻ lộng lẫy tột độ cho phòng khách.",
    material: "Đá cẩm thạch trắng mây Carrara tự nhiên, Khung chân Inox 304 mạ PVD Titan vàng",
    dimensions: "Đường kính 90cm x Cao 42cm",
    colors: ["Đá Trắng Vân Mây - Chân Vàng", "Đá Đen Nero Marquina - Chân Vàng"],
    features: ["Bề mặt đá chống ốc thấm ố vàng", "Góc bo mượt mà chống đâm va an toàn gia đình", "Chân mạ Titan không hoen gỉ"],
    warranty: "2 năm",
    stock: 25,
    brand: "Giacomo Design",
    reviews: [
      { id: "rev-3", author: "Lê Cương", rating: 4.5, comment: "Kích thước vừa khít căn hộ hiện đại. Màu vàng của chân sang trọng, không bị sến.", date: "2026-05-22" }
    ]
  },
  {
    id: "prod-03",
    name: "Giường Ngủ Hoàng Gia Master - Silk King Velour",
    price: 42000000,
    rating: 5,
    category: "phong-ngu",
    categoryName: "Phòng Ngủ",
    style: "Luxury",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Giường ngủ Master King bọc vải nhung lụa mịn sang trọng thượng lưu, đầu giường may rút múi cổ điển đính cúc thủ công khéo léo.",
    longDescription: "Chiếc giường xứng tầm tâm điểm cho phòng ngủ Master vương giả. Đầu giường thiết kế khổ lớn uốn lượn phong cách Baroque cổ điển, bọc vải nhung tơ tằm nhập khẩu mềm mịn mượt như dòng suối, phản quang óng ánh khi gặp ánh sáng đèn ngủ. Giường chịu lực bởi khung sắt hộp sơn tĩnh điện phối phản giường bằng gỗ Bạch Dương đàn hồi dẻo dai giúp tăng tuổi thọ nệm tối đa.",
    material: "Khung hợp kim chịu lực, nhung Silk Velour châu Âu, Dát giường gỗ Bạch Dương",
    dimensions: "Rộng 200cm x Dài 220cm x Cao 135cm",
    colors: ["Xanh Emerald", "Xám Ngọc Trai (Pearl Gray)", "Beige Hoàng Gia"],
    features: ["Khung sườn chịu tải 800kg", "Bề mặt chống xù xước", "Thiết kế giảm ồn tuyệt đối"],
    warranty: "5 năm",
    stock: 8,
    brand: "Belgian Comfort",
    reviews: [
      { id: "rev-4", author: "Trần Đăng Khoa", rating: 5, comment: "Nhung dệt cao cấp sờ mềm kinh khủng. Thiết kế sang, ai vào nhà cũng khen.", date: "2026-05-18" }
    ]
  },
  {
    id: "prod-04",
    name: "Tủ Quần Áo Âm Tường Kính Cường Lực - Aurora Clear Lux",
    price: 54000000,
    rating: 4.7,
    category: "phong-ngu",
    categoryName: "Phòng Ngủ",
    style: "Modern",
    images: [
      "https://images.unsplash.com/photo-1558882224-cca166733360?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Tủ quần áo thông minh gỗ Óc Chó, cánh kính cường lực màu xám đục mờ, tích hợp dải Led tiệm cận cao cấp.",
    longDescription: "Hệ tủ quần áo thông minh tối ưu không gian sang trọng tựa boutique store. Sử dụng gỗ Óc Chó cao cấp sấy độ ẩm chuẩn 12%, cánh tủ là kính cường lực chịu nhiệt đạt chứng chỉ quốc tế dán bo viền nhôm Anode hoàn hảo màu than khói đen. Tích hợp thanh led âm tủ cảm ứng rung/tiệm cận từ Đức, tự động bừng sáng dịu êm khi khẽ chạm mở cánh.",
    material: "Gỗ Óc Chó nhập khẩu, Kính Temper xám khói, Viền nhôm định hình cao cấp",
    dimensions: "Ngang 240cm x Sâu 60cm x Cao 260cm",
    colors: ["Gỗ Óc Chó - Kính Khói Đen", "Gỗ Sồi Natural - Kính Khói Trắng"],
    features: ["Đèn LED cảm ứng tiệm cận", "Bản lề hơi Hafele giảm chấn êm ru", "Ngăn treo đồ da tinh tế phụ trợ"],
    warranty: "3 năm phần tủ, trọn đời phần bản lề",
    stock: 5,
    brand: "LuxeHome Custom",
    reviews: []
  },
  {
    id: "prod-05",
    name: "Bàn Ăn Gỗ Sồi Chun Tự Nhiên - Nordic Organic Dining",
    price: 32200000,
    rating: 4.9,
    category: "phong-an",
    categoryName: "Phòng Ăn",
    style: "Scandinavian",
    images: [
      "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Bàn ăn nguyên khối Scandinavian tôn vinh nét mộc mạc hữu cơ, các cạnh uốn mềm theo sớ vân tự nhiên tuyệt đẹp.",
    longDescription: "Nếu phong cách mộc mạc thuần khiết Bắc Âu là điều bạn theo đuổi, Nordic Organic Dining là mảnh ghép trung tâm tuyệt mỹ. Tuyển chọn sớ sồi già từ cánh rừng rậm Thụy Điển với vân mộc cuồn cuộn sống động như bức tranh sơn dầu. Mặt bàn dày 4.5cm nguyên tấm sơn lau dầu Rubio Monocoat của Bỉ, không chứa chì độc hại, an toàn tuyệt đối với thực phẩm tiếp xúc trực tiếp.",
    material: "Gỗ Sồi trắng Bắc Âu nguyên khối, Lau dầu tự nhiên organic an toàn sức khỏe",
    dimensions: "Dài 180cm x Rộng 90cm x Cao 75cm (Dành cho 6-8 người ngồi)",
    colors: ["Sồi Vàng Tự Nhiên (Natural Oak)", "Sồi Đậm Óc Chó (Smoked Oak)"],
    features: ["Mặt bàn chống nước, chống bám cà phê tỏi ớt", "Góc bo tự nhiên vân thâm mộc mạc", "Bao gồm sáp lau bảo dưỡng trọn đời"],
    warranty: "5 năm",
    stock: 15,
    brand: "Nordic Soul",
    reviews: [
      { id: "rev-5", author: "Hoàng Anh", rating: 5, comment: "Gỗ sồi mộc rất thơm, sờ ráp thanh nhẹ cực tinh tế. Mặt bàn không bị ngấm nước canh.", date: "2026-05-10" }
    ]
  },
  {
    id: "prod-06",
    name: "Ghế Ăn Thư Giãn Bọc Da Nappa - Milano Curve",
    price: 6500000,
    rating: 4.8,
    category: "phong-an",
    categoryName: "Phòng Ăn",
    style: "Minimalist",
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1501183007986-d0d080b147f9?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Ghế ăn tối giản tinh tế, ôm trọn eo người ngồi bọc da Nappa mịn màng thượng hạng chân sơn tĩnh điện nhám cát.",
    longDescription: "Kiệt tác thiết kế mang xu hướng Minimalism đương đại. Dáng ghế Milano Curve cong võng nâng niu trọn vẹn sống lưng cùng khớp hông, loại bỏ áp lực mệt mỏi trong bữa ăn gia đình kéo dài. Vải bọc ngoài bọc da Nappa tổng hợp chuyên dụng cho siêu xe tột bậc mịn, chống mồ hôi và dễ lau sạch vết sốt mỡ chỉ trong một cú lau.",
    material: "Xương thép đúc chịu tải cao, mút ôm mật độ cao, Da Nappa cao cấp siêu chịu co giãn",
    dimensions: "Ngang 54cm x Sâu 56cm x Cao 82cm",
    colors: ["Ghi Xám Khói", "Beige Ngọc Trai", "Nâu Café Latte"],
    features: ["Chân lót cao su giảm ồn trầy sàn", "Chịu tải 200kg không xô nghiêng", "Rất nhẹ dễ di chuyển sắp đặt"],
    warranty: "18 tháng",
    stock: 45,
    brand: "Milano Lab",
    reviews: [
      { id: "rev-6", author: "Bảo Nhi", rating: 4, comment: "Ghế ngồi thoải mái mọc, ôm lưng tốt. Nhà mình mua 6 chiếc màu be bài phối rất đẹp.", date: "2026-05-14" }
    ]
  },
  {
    id: "prod-07",
    name: "Bàn Làm Việc Giám Đốc Cao Cấp - Executive Prestige",
    price: 36000000,
    rating: 4.9,
    category: "van-phong",
    categoryName: "Văn Phòng",
    style: "Luxury",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Bàn làm việc bệ thế gỗ Óc Chó, bọc da ở vùng gõ phím mạ viền champagne gold thanh mảnh.",
    longDescription: "Prestige là sự tối thượng thể hiện quyền uy lãnh đạo và tinh thần làm việc không tì vết. Chế tác thủ công phối da mộc chống tì mỏi khuỷu cùng lớp sơn phủ bóng PU bóng mờ cao cấp của Mỹ phô diễn trọn vẹn những đường vân cuộn cuộn của thớ gỗ Óc Chó cổ thụ. Tích hợp nắp hộp luồn dây điện thông minh ẩn hòm bản kẽm cao cấp, khay sạc không dây 15W chìm ẩn tinh tế.",
    material: "Gỗ Óc Chó (Walnut) cao cấp, Vành bọc da thuộc thảo mộc, khay luồn thép mạ Titan",
    dimensions: "Dài 200cm x Rộng 90cm x Cao 76cm",
    colors: ["Óc Chó Gold - Phối Da Đen", "Óc Chó Natural - Phối Da Kem"],
    features: ["Tích hợp đế sạc không dây 15W chìm", "Khay luồn dây âm mặt bàn sang xịn", "Ngăn kéo có khóa vân tay sinh trắc học"],
    warranty: "5 năm",
    stock: 6,
    brand: "Giacomo Design",
    reviews: []
  },
  {
    id: "prod-08",
    name: "Ghế Công Thái Học Luxury - Ergonomic Masterpiece",
    price: 15400000,
    rating: 4.9,
    category: "van-phong",
    categoryName: "Văn Phòng",
    style: "Minimalist",
    images: [
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1589384267710-7a259678a59a?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?auto=format&fit=crop&q=80&w=800"
    ],
    description: "Ghế làm việc công thái học hỗ trợ tựa cột sống thắt lưng thông minh 3D, lưới dệt đàn hồi Krall&Roth từ Đức mát rượi thanh bình.",
    longDescription: "Ergonomic Masterpiece giải quyết triệt để tất cả nỗi đau đầu cổ vai gáy của người làm việc thời đại số. Sử dụng khung nhựa kĩ thuật siêu chịu lực bọc viền mạ Chrome bóng sáng vô ngần. Lưới đàn hồi nguyên bản nhập từ Đức dệt chịu lực đàn hồi tối thượng, điều hòa thân nhiệt mướt rượi không giữ mồ hôi. Hỗ trợ ôm đỡ tựa thắt lưng chủ động biến thiên theo góc tựa góc rướn cột sống người nằm ngả giấc trưa.",
    material: "Lưới đàn hồi Krall&Roth cao cấp, Khung nhựa Polymer gia sườn thép, Chân nhôm đúc nguyên miếng",
    dimensions: "Rộng 66cm x Sâu 64cm x Cao 115-125cm",
    colors: ["Trắng Ngọc Trai - Lưới Cream", "Đen Carbon Matte - Lưới Đen"],
    features: ["Bệ tì tay 4D chỉnh 5 hướng linh hoạt", "Ngả lưng nệm sâu khóa góc 135 độ nằm nghỉ", "Piston nâng trục thủy lực Class 4 an toàn bùng nổ"],
    warranty: "5 năm",
    stock: 18,
    brand: "Heritage Milano",
    reviews: [
      { id: "rev-7", author: "Lê Minh Dương", rating: 5, comment: "Ngồi ghế này hết hẳn đau lưng dưới. Lưới sờ cực chắc chắn dẻo dai, không bị nhão sau nửa năm chịu ngồi béo xệ như mấy mẫu rẻ tiền.", date: "2026-05-24" }
    ]
  }
];

export const MOCK_COMBOS: Combo[] = [
  {
    id: "combo-01",
    name: "Bộ Sưu Tập Living Richness - Luxury Living Room",
    description: "Sự kết hợp tối thượng tôn vinh quyền thế phòng khách độc bản. Bao gồm Sovereign Sofa Da Bò Ý cao cấp và Bàn Trà Đá Cẩm Thạch Venice kiêu hãnh.",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800",
    productIds: ["prod-01", "prod-02"],
    price: 87000000,
    discountPrice: 79000000, // Tiết kiệm 8.000.000đ khi mua combo!
    roomSize: "Từ 20m² - 35m²",
    roomType: "Phòng Khách"
  },
  {
    id: "combo-02",
    name: "Phòng Ngủ Master Yên Bình - Scandinavian Comfort Master",
    description: "Không gian ngủ thắm đượm hơi thở mộc mạc thư thả. Đi kèm Giường Ngủ Nhung Velvet master lụa là ấm và Tủ Quần Áo Âm Tường Kính Cường Lực đèn vàng dịu nhẹ.",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&q=80&w=800",
    productIds: ["prod-03", "prod-04"],
    price: 96000000,
    discountPrice: 88000000, // Tiết kiệm 8.000.000đ khi mua combo
    roomSize: "Từ 15m² - 25m²",
    roomType: "Phòng Ngủ"
  },
  {
    id: "combo-03",
    name: "Phòng Làm Việc Sang Trọng - Executive Elite Suite",
    description: "Kiến tạo phòng tổng tư lệnh cơ quan uy dũng với bộ bàn sếp sang trọng Executive Prestige Walnut và Ghế Công Thái Học Đỉnh Cao Ergonomic Masterpiece.",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800",
    productIds: ["prod-07", "prod-08"],
    price: 51400000,
    discountPrice: 47000000, // Tiết kiệm 4.400.000đ
    roomSize: "Từ 12m² - 20m²",
    roomType: "Văn Phòng"
  }
];

export const MOCK_BLOGS: BlogPost[] = [
  {
    id: "blog-01",
    title: "Nghệ Thuật Phối Màu Vàng Champagne và Vân Kim Loại Trong Thiết Kế Nội Thất Luxury",
    excerpt: "Làm thế nào để đưa kim loại quý phái vào nhà ở mà không tạo cảm giác nặng nề lóa mắt? Tìm hiểu bí quyết dung hòa giữa vàng, kem nhung và gỗ óc chó mộc.",
    content: "Xu hướng nội thất Luxury luôn tìm thấy nguồn cảm hứng dồi dào từ các tông màu kim loại quý tộc. Trong đó, vàng Champagne (Champagne Gold) với sắc óng ánh ấm nhẹ đang dần chiếm thế độc tôn bờ cõi, soán vôi vàng đồng bừng chói lóa của thập niên cũ. Bí kíp lớn nhất chính là tỉ lệ vàng 60-30-10 trong phối cảnh màu: 60% sơn lót màu thạch cao, 30% nội thất gỗ óc chó trầm lặng ấm ủ, và chỉ 10% các đường chỉ mạ PVD vàng óng rực rỡ lướt dọc chân bàn, nẹp tường để tạo điểm nhấm tinh khôi lôi cuốn con mắt nhìn.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
    category: "Cảm hứng thiết kế",
    author: "Kiến trúc sư Lê Anh Đức",
    date: "2026-05-22",
    readTime: "5 phút đọc"
  },
  {
    id: "blog-02",
    title: "Chủ Nghĩa Tối Giản Scandinavian Đương Đại: Vải Thô Dệt và Sớ Già Gỗ Sồi Chun",
    excerpt: "Sự thô mộc làm nên giá trị thanh khiết tinh thần Bắc Âu. Cùng LuxeHome lí giải sức hút dai dẳng kỳ lạ của phong cách mộc tự nhiên mướt mắt trong cuộc sống bận rộn.",
    content: "Được xây dựng trên triết lý tối giản lấy thiên nhiên làm gốc rễ nâng đỡ sinh hoạt của con người, phong cách Scandinavian đương đại của LuxeHome không bao giờ sơn che lấp lớp vân gỗ sồi nguyên gốc kiêu sa. Thay vào đó, chúng tôi gìn giữ sớ thớ tự nhiên, bôi dầu lanh mịn Rubio lấp lánh nhẹ nhàng, kết hợp cùng các dòng vải lanh thô dệt ngọc mịn dày dặn. Thả mình vào chiếc sofa mộc mạc, nhìn khói trà len lỏi trong nắng chiều xiên góc, đó là khoảnh khắc hồi sinh năng lượng bình yên vô giá sau vạn dặm thị thành mỏi mệt bận bịu.",
    image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=800",
    category: "Kiến thức vật liệu",
    author: "Designer Đặng Thu Hà",
    date: "2026-05-28",
    readTime: "4 phút đọc"
  }
];

export const MOCK_COUPONS: Coupon[] = [
  { code: "LUXE10", discountType: "percent", value: 10, minSubtotal: 20000000, description: "Giảm 10% tổng giá trị đơn hàng cho đơn hàng cao sang từ 20tr", isActive: true },
  { code: "CHAMPAGNE5M", discountType: "fixed", value: 5000000, minSubtotal: 50000000, description: "Giảm ngay 5.000.000đ khi đặt trước sản phẩm từ 50tr đồng", isActive: true },
  { code: "WELCOME20", discountType: "percent", value: 20, minSubtotal: 100000000, description: "Ưu đãi thành viên mới: giảm tối đa 20% cho đại tiệc combo từ 100tr", isActive: true }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "LH-98218",
    date: "2026-05-28",
    customerName: "Nguyễn Lâm Thao",
    customerPhone: "0901234567",
    shippingAddress: {
      city: "Thành phố Hồ Chí Minh",
      district: "Quận 1",
      addressDetail: "120 Lê Lợi, Bến Thành"
    },
    items: [
      {
        productId: "prod-02",
        name: "Bàn Trà Đá Cẩm Thạch Carrara - Venice Golden Frame",
        price: 18500000,
        quantity: 1,
        color: "Đá Trắng Vân Mây - Chân Vàng",
        material: "Đá cẩm thạch trắng mây Carrara tự nhiên",
        assembleService: true
      }
    ],
    couponApplied: "LUXE10",
    discountAmount: 1850000,
    shippingFee: 350000,
    totalAmount: 17000000,
    paymentMethod: "BankTransfer",
    status: "shipping",
    paymentStatus: "Đã thanh toán",
    trackingSteps: [
      { status: "pending", title: "Đặt hàng thành công", description: "Đơn hàng xa xỉ đã được tiếp nhận bởi hệ thống kiểm kho LuxeHome.", time: "10:30, 2026-05-28" },
      { status: "confirmed", title: "Chuẩn bị đơn hàng", description: "Xưởng bàn gỗ chạm mạ vàng tỉ mỉ đóng xốp mềm sấy bóng bảo quản hoàn tất.", time: "15:20, 2026-05-28" },
      { status: "shipping", title: "Đang vận chuyển", description: "Xe siêu chuyên dụng điều hòa chống xốc đang di chuyển bàn trà nội thành giao tận căn hộ.", time: "08:15, 2026-06-01" }
    ]
  },
  {
    id: "LH-95112",
    date: "2026-05-24",
    customerName: "Nguyễn Lâm Thao",
    customerPhone: "0901234567",
    shippingAddress: {
      city: "Thành phố Hồ Chí Minh",
      district: "Quận 1",
      addressDetail: "120 Lê Lợi, Bến Thành"
    },
    items: [
      {
        productId: "prod-06",
        name: "Ghế Ăn Thư Giãn Bọc Da Nappa - Milano Curve",
        price: 6500000,
        quantity: 2,
        color: "Beige Ngọc Trai",
        material: "Xương thép đúc, Da Nappa cao cấp",
        assembleService: false
      }
    ],
    discountAmount: 0,
    shippingFee: 150000,
    totalAmount: 13150000,
    paymentMethod: "COD",
    status: "completed",
    paymentStatus: "Đã thanh toán",
    trackingSteps: [
      { status: "pending", title: "Đặt hàng thành công", description: "Tiếp nhận đơn đặt hàng 2 ghế ăn Milano Curve.", time: "09:00, 2026-05-24" },
      { status: "confirmed", title: "Đã đóng gói hàng", description: "Đã đóng thùng bọc góc xốp dày màng PE chống trầy.", time: "11:00, 2026-05-24" },
      { status: "shipping", title: "Giao vận hoàn tất", description: "Giao nhà an toàn, khách đã ký nhận hài lòng không tì vết.", time: "14:30, 2026-05-24" }
    ],
    reviewsSubmitted: false
  }
];

export const INITIAL_SCHEDULES: ConsultationSchedule[] = [
  {
    id: "SCH-01",
    customerName: "Vũ Khánh Linh",
    phone: "0987654321",
    email: "linhvu@luxury.vn",
    roomArea: 45,
    roomType: "Phòng Khách căn hộ Vinhomes Masterise",
    style: "Luxury Modern",
    budget: 350000000,
    prefDate: "2026-06-05",
    prefTime: "14:30",
    notes: "Có nhu cầu phối tông màu be nhẹ óng ánh vàng champagne đồng bộ với trần thạch cao uốn lượn.",
    status: "pending"
  }
];
