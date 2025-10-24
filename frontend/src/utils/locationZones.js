// Malaysian state and zone mappings for JAKIM
export const JAKIM_ZONES = {
  // Selangor
  'SGR01': 'Kuala Lumpur, Putrajaya',
  'SGR02': 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam',
  'SGR03': 'Klang, Kuala Langat, Kuala Selangor',
  
  // Johor
  'JHR01': 'Pulau Aur, Pulau Pemanggil',
  'JHR02': 'Johor Bahru, Kota Tinggi, Mersing, Kulai',
  'JHR03': 'Kluang, Pontian',
  'JHR04': 'Batu Pahat, Muar, Segamat, Tangkak',
  
  // Kedah
  'KDH01': 'Kota Setar, Kubang Pasu, Pokok Sena',
  'KDH02': 'Kuala Muda, Yan, Pendang',
  'KDH03': 'Padang Terap, Sik',
  'KDH04': 'Baling',
  'KDH05': 'Bandar Baharu, Kulim',
  'KDH06': 'Langkawi',
  'KDH07': 'Puncak Gunung Jerai',
  
  // Kelantan
  'KTN01': 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku',
  'KTN02': 'Gua Musang (Daerah Galas Dan Bertam), Jeli',
  'KTN03': 'Kecil Lojing',
  
  // Melaka
  'MLK01': 'SELURUH NEGERI MELAKA',
  
  // Negeri Sembilan
  'NGS01': 'Tampin, Jempol',
  'NGS02': 'Jelebu, Kuala Pilah, Rembau, Seremban, Port Dickson',
  
  // Pahang
  'PHG01': 'Pulau Tioman',
  'PHG02': 'Kuantan, Pekan, Rompin, Muadzam Shah',
  'PHG03': 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka',
  'PHG04': 'Bentong, Lipis, Raub',
  'PHG05': 'Genting Sempah, Janda Baik, Bukit Tinggi',
  'PHG06': 'Cameron Highlands, Lojing, Sungai Koyan',
  
  // Perak
  'PRK01': 'Tapah, Slim River, Tanjung Malim',
  'PRK02': 'Kuala Kangsar, Sg. Siput , Ipoh, Batu Gajah, Kampar',
  'PRK03': 'Selama, Taiping, Bagan Serai, Parit Buntar',
  'PRK04': 'Bukit Larut',
  'PRK05': 'Gerik, Pengkalan Hulu, Lenggong',
  'PRK06': 'Kuala Kangsar (Daerah Kecil Kg. Buaya)',
  'PRK07': 'Pulau Pangkor',
  
  // Perlis
  'PLS01': 'KANGAR',
  
  // Penang
  'PNG01': 'Seluruh Negeri Pulau Pinang',
  
  // Sabah
  'SBH01': 'Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau',
  'SBH02': 'Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)',
  'SBH03': 'Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)',
  'SBH04': 'Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)',
  'SBH05': 'Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat',
  'SBH06': 'Gunung Kinabalu',
  'SBH07': 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat',
  'SBH08': 'Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pendalaman (Atas)',
  'SBH09': 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pa Sia, Membakut, Bahagian Pendalaman (Bawah)',
  
  // Sarawak
  'SRW01': 'Limbang, Lawas, Sundar, Trusan',
  'SRW02': 'Miri, Niah, Bekenu, Sibuti, Marudi',
  'SRW03': 'Pandan, Belaga, Suai, Tatau, Sebauh',
  'SRW04': 'Sibu, Mukah, Dalat, Song, Igan, Oya, Bintulu, Kanowit, Kapit',
  'SRW05': 'Sarikei, Matu, Julau, Rajang, Daro, Balingian, Meradong, Tanjung Manis',
  'SRW06': 'Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok',
  'SRW07': 'Serian, Simunjan, Samarahan, Sebuyau, Meludam',
  'SRW08': 'Kuching, Bau, Lundu, Sematan',
  'SRW09': 'Zon Khas (Kampung Patarikan)',
  
  // Terengganu
  'TRG01': 'Kuala Terengganu, Marang, Kuala Nerus',
  'TRG02': 'Besut, Setiu',
  'TRG03': 'Hulu Terengganu',
  'TRG04': 'Dungun, Kemaman',
  
  // Wilayah Persekutuan
  'WLY01': 'Kuala Lumpur, Putrajaya',
  'WLY02': 'Labuan'
};

export const getZoneName = (zoneCode) => {
  return JAKIM_ZONES[zoneCode] || zoneCode;
};

export const getSimpleZoneName = (zoneCode) => {
  const fullName = JAKIM_ZONES[zoneCode];
  if (!fullName) return zoneCode;
  
  // Extract clean city/state names
  const name = fullName.split(',')[0].trim();
  
  // Map to clean names
  if (name.includes('Kuala Lumpur') || name.includes('WLY01')) return 'Kuala Lumpur';
  if (name.includes('Selangor') || zoneCode.startsWith('SGR')) return 'Selangor';
  if (name.includes('Johor') || zoneCode.startsWith('JHR')) return 'Johor';
  if (name.includes('Kedah') || zoneCode.startsWith('KDH')) return 'Kedah';
  if (name.includes('Kelantan') || zoneCode.startsWith('KTN')) return 'Kelantan';
  if (name.includes('Melaka') || zoneCode.startsWith('MLK')) return 'Melaka';
  if (name.includes('Negeri Sembilan') || zoneCode.startsWith('NGS')) return 'Negeri Sembilan';
  if (name.includes('Pahang') || zoneCode.startsWith('PHG')) return 'Pahang';
  if (name.includes('Perak') || zoneCode.startsWith('PRK')) return 'Perak';
  if (name.includes('Perlis') || zoneCode.startsWith('PLS')) return 'Perlis';
  if (name.includes('Pulau Pinang') || zoneCode.startsWith('PNG')) return 'Pulau Pinang';
  if (name.includes('Sabah') || zoneCode.startsWith('SBH')) return 'Sabah';
  if (name.includes('Sarawak') || zoneCode.startsWith('SRW')) return 'Sarawak';
  if (name.includes('Terengganu') || zoneCode.startsWith('TRG')) return 'Terengganu';
  if (name.includes('Labuan') || zoneCode.startsWith('WLY02')) return 'Labuan';
  
  // For specific cities
  if (name.includes('Johor Bahru')) return 'Johor Bahru, Johor';
  if (name.includes('Kota Kinabalu')) return 'Kota Kinabalu, Sabah';
  if (name.includes('Kuching')) return 'Kuching, Sarawak';
  if (name.includes('Ipoh')) return 'Ipoh, Perak';
  if (name.includes('Klang')) return 'Klang, Selangor';
  
  return name;
};