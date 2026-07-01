import type { CurriculumSubject } from "@/lib/curriculum/types";

// Kaynak: T.C. Millî Eğitim Bakanlığı, 8. Sınıf Ders Kazanımları Listesi
// (Öğretim programlarından derlenmiş temel kazanım başlıkları)
export const GRADE_8_CURRICULUM: CurriculumSubject[] = [
  {
    subject: "Türkçe",
    units: [
      {
        name: "Dinleme/İzleme (T.8.1)",
        outcomes: [
          { code: "T.8.1.1", description: "Dinlediklerinde/izlediklerinde geçen bilmediği kelimelerin anlamını tahmin eder." },
          { code: "T.8.1.2", description: "Dinlediklerinin/izlediklerinin konusunu belirler." },
          { code: "T.8.1.3", description: "Dinlediklerinin/izlediklerinin ana fikrini/ana duygusunu belirler." },
          { code: "T.8.1.4", description: "Dinledikleriyle/izledikleriyle ilgili sorulara cevap verir." },
          { code: "T.8.1.5", description: "Dinlediklerine/izlediklerine yönelik farklı başlıklar önerir." },
          { code: "T.8.1.6", description: "Dinlediği/izlediği konuşmacının sözlü olmayan mesajlarını kavrar." },
          { code: "T.8.1.7", description: "Dinlediklerinin/izlediklerinin tutarlılığını sorgular." },
          { code: "T.8.1.8", description: "Dinlediklerini/izlediklerini özetler." },
        ],
      },
      {
        name: "Konuşma (T.8.2)",
        outcomes: [
          { code: "T.8.2.1", description: "Hazırlıklı konuşma yapar." },
          { code: "T.8.2.2", description: "Hazırlıksız konuşma yapar." },
          { code: "T.8.2.3", description: "Konuşmalarında beden dilini etkili bir şekilde kullanır." },
          { code: "T.8.2.4", description: "Konuşmalarında uygun geçiş ve bağlantı ifadelerini kullanır." },
          { code: "T.8.2.5", description: "Kelimeleri anlamlarına uygun ve doğru telaffuz ederek konuşur." },
        ],
      },
      {
        name: "Okuma (T.8.3)",
        outcomes: [
          { code: "T.8.3.1", description: "Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder." },
          { code: "T.8.3.2", description: "Deyim ve atasözlerinin metne katkısını belirler." },
          { code: "T.8.3.3", description: "Fiilimsilerin cümledeki işlevlerini kavrar." },
          { code: "T.8.3.4", description: "Okuduklarını özetler." },
          { code: "T.8.3.5", description: "Metnin konusunu belirler." },
          { code: "T.8.3.6", description: "Metnin ana fikrini/ana duygusunu belirler." },
          { code: "T.8.3.7", description: "Metindeki yardımcı fikirleri belirler." },
          { code: "T.8.3.8", description: "Metinle ilgili soruları cevaplar ve sorular sorar." },
          { code: "T.8.3.9", description: "Metnin içeriğine uygun başlık/başlıklar belirler." },
          { code: "T.8.3.10", description: "Metnin öncesi ve/veya sonrasıyla ilgili tahminlerde bulunur." },
          { code: "T.8.3.11", description: "Metindeki geçiş ve bağlantı unsurlarını belirler." },
          { code: "T.8.3.12", description: "Görsellerle ilgili soruları cevaplar." },
          { code: "T.8.3.13", description: "Grafik, tablo ve çizelgelerle sunulan bilgileri yorumlar." },
          { code: "T.8.3.14", description: "Metindeki söz sanatlarını (teşbih, istiare, teşhis, intak, tezat) tespit eder." },
          { code: "T.8.3.15", description: "Okuduğu metnin dil ve anlatım özelliklerini belirler." },
          { code: "T.8.3.16", description: "Metnin türünü belirler." },
          { code: "T.8.3.17", description: "Metindeki nesnel ve öznel yargıları ayırt eder." },
          { code: "T.8.3.18", description: "Metindeki iş ve işlem basamaklarını kavrar." },
          { code: "T.8.3.19", description: "Bilgi kaynaklarının güvenilirliğini sorgular." },
          { code: "T.8.3.20", description: "Okuduklarında yararlanılan düşünceyi geliştirme yollarını belirler." },
        ],
      },
      {
        name: "Yazma (T.8.4)",
        outcomes: [
          { code: "T.8.4.1", description: "Şiir yazar." },
          { code: "T.8.4.2", description: "Bilgilendirici metin yazar." },
          { code: "T.8.4.3", description: "Hikâye edici metin yazar." },
          { code: "T.8.4.4", description: "Yazma sürecini uygular." },
          { code: "T.8.4.5", description: "Yazdıklarını düzenler." },
          { code: "T.8.4.6", description: "Cümlenin ögelerini ayırt eder." },
          { code: "T.8.4.7", description: "Cümle türlerini tanır." },
          { code: "T.8.4.8", description: "Fiillerin çatı özelliklerinin anlama olan katkısını kavrar." },
          { code: "T.8.4.9", description: "Cümledeki anlatım bozukluklarını belirler ve düzeltir." },
        ],
      },
    ],
  },
  {
    subject: "Matematik",
    units: [
      {
        name: "Sayılar ve İşlemler",
        outcomes: [
          { code: "M.8.1.1.1", description: "Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, pozitif tam sayıların pozitif tam sayı çarpanlarını üslü ifadelerin çarpımı şeklinde yazar." },
          { code: "M.8.1.1.2", description: "İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer." },
          { code: "M.8.1.1.3", description: "Verilen iki doğal sayının aralarında asal olup olmadığını belirler." },
          { code: "M.8.1.2.1", description: "Tam sayıların, tam sayı kuvvetlerini hesaplar." },
          { code: "M.8.1.2.2", description: "Üslü ifadelerle ilgili temel kuralları anlar, üslü ifadelerle çarpma ve bölme işlemlerini yapar." },
          { code: "M.8.1.2.3", description: "Sayıların ondalık gösterimlerini 10'un tam sayı kuvvetlerini kullanarak çözümler." },
          { code: "M.8.1.2.4", description: "Çok büyük ve çok küçük sayıları 10'un farklı tam sayı kuvvetlerini kullanarak ifade eder." },
          { code: "M.8.1.2.5", description: "Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır." },
          { code: "M.8.1.3.1", description: "Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler." },
          { code: "M.8.1.3.2", description: "Tam kare olmayan kareköklü bir sayının değerinin hangi iki doğal sayı arasında olduğunu belirler." },
          { code: "M.8.1.3.3", description: "Kareköklü bir ifadeyi a√b şeklinde yazar ve a√b şeklindeki ifadeden katsayıyı kök içine alır." },
          { code: "M.8.1.3.4", description: "Kareköklü ifadelerle çarpma ve bölme işlemlerini yapar." },
          { code: "M.8.1.3.5", description: "Kareköklü ifadelerle toplama ve çıkarma işlemlerini yapar." },
          { code: "M.8.1.3.6", description: "Kareköklü bir ifade ile çarpıldığında, sonucu bir doğal sayı yapan çarpanları belirler." },
          { code: "M.8.1.3.7", description: "Ondalık ifadelerin kareköklerini belirler." },
          { code: "M.8.1.3.8", description: "Gerçek sayıları ayırt eder, rasyonel ve irrasyonel sayılarla ilişkilendirir." },
        ],
      },
      {
        name: "Veri İşleme",
        outcomes: [
          { code: "M.8.2.1.1", description: "En fazla üç veri grubuna ait sütun, daire veya çizgi grafiklerini oluşturur ve yorumlar." },
        ],
      },
      {
        name: "Cebir",
        outcomes: [
          { code: "M.8.2.2.1", description: "Basit cebirsel ifadeleri farklı biçimlerde yazar." },
          { code: "M.8.2.2.2", description: "Cebirsel ifadelerin çarpımını yapar." },
          { code: "M.8.2.2.3", description: "Özdeşlikleri modellerle açıklar." },
          { code: "M.8.2.2.4", description: "Cebirsel ifadeleri çarpanlara ayırır." },
          { code: "M.8.2.3.1", description: "Birinci dereceden bir bilinmeyenli denklemleri çözer." },
          { code: "M.8.2.3.2", description: "Koordinat sistemini özellikleriyle tanır ve sıralı ikilileri gösterir." },
          { code: "M.8.2.3.3", description: "Aralarında doğrusal ilişki bulunan iki değişkenden birinin diğerine bağlı olarak nasıl değiştiğini tablo ve grafikle ifade eder." },
          { code: "M.8.2.3.4", description: "Doğrusal denklemlerin grafiğini çizer." },
          { code: "M.8.2.3.5", description: "Doğrusal ilişki içeren gerçek hayat durumlarına ait denklem, tablo ve grafiği oluşturur ve yorumlar." },
          { code: "M.8.2.3.6", description: "Doğrunun eğimini modellerle açıklar, doğrusal denklem ve grafiklerle ilişkilendirir." },
          { code: "M.8.2.4.1", description: "Birinci dereceden bir bilinmeyenli eşitsizlikleri içeren günlük hayat durumlarına uygun matematik cümleleri yazar." },
          { code: "M.8.2.4.2", description: "Birinci dereceden bir bilinmeyenli eşitsizlikleri sayı doğrusunda gösterir." },
          { code: "M.8.2.4.3", description: "Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer." },
        ],
      },
      {
        name: "Geometri ve Ölçme",
        outcomes: [
          { code: "M.8.3.1.1", description: "Üçgende kenarortay, açıortay ve yüksekliği inşa eder." },
          { code: "M.8.3.1.2", description: "Üçgenin iki kenar uzunluğunun toplamı veya farkı ile üçüncü kenarının uzunluğu arasındaki ilişkiyi belirler." },
          { code: "M.8.3.1.3", description: "Üçgenin kenar uzunlukları ile bu kenarların karşısındaki açıların ölçülerini ilişkilendirir." },
          { code: "M.8.3.1.4", description: "Yeterli sayıda elemanının ölçüleri verilen üçgeni çizer." },
          { code: "M.8.3.1.5", description: "Pisagor bağıntısını oluşturur, ilgili problemleri çözer." },
          { code: "M.8.3.2.1", description: "Eş ve benzer çokgenlerin kenar ve açı ilişkilerini belirler, benzerlik oranını açıklar." },
          { code: "M.8.3.2.2", description: "Çokgenlerin eş ve benzer olup olmadığını belirler, ilgili problemleri çözer." },
          { code: "M.8.3.3.1", description: "Nokta, doğru parçası ve diğer şekillerin öteleme altındaki görüntülerini çizer." },
          { code: "M.8.3.3.2", description: "Nokta, doğru parçası ve diğer şekillerin yansıma altındaki görüntülerini çizer." },
          { code: "M.8.3.3.3", description: "Çokgenlerin koordinat düzlemi üzerinde öteleme ve yansıma altındaki görüntülerini çizer." },
          { code: "M.8.3.4.1", description: "Dik prizmaları tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer." },
          { code: "M.8.3.4.2", description: "Dik dairesel silindirin temel elemanlarını belirler, inşa eder ve açınımını çizer." },
          { code: "M.8.3.4.3", description: "Dik dairesel silindirin yüzey alanı bağıntısını oluşturur, ilgili problemleri çözer." },
          { code: "M.8.3.4.4", description: "Dik dairesel silindirin hacim bağıntısını oluşturur, ilgili problemleri çözer." },
          { code: "M.8.3.4.5", description: "Dik piramiti tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer." },
          { code: "M.8.3.4.6", description: "Dik koniyi tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer." },
        ],
      },
      {
        name: "Olasılık",
        outcomes: [
          { code: "M.8.5.1.1", description: "Bir olaya ait olası durumları belirler." },
          { code: "M.8.5.1.2", description: "\"Daha fazla\", \"eşit\", \"daha az\" olasılıklı olayları ayırt eder, örnek verir." },
          { code: "M.8.5.1.3", description: "Eşit şansa sahip olan olaylarda her bir çıktının olasılık değerinin eşit olduğunu ve bu değerin 1/n olduğunu açıklar." },
          { code: "M.8.5.1.4", description: "Olasılık değerinin 0 ile 1 arasında (0 ve 1 dâhil) olduğunu anlar." },
          { code: "M.8.5.1.5", description: "Basit bir olayın olma olasılığını hesaplar." },
        ],
      },
    ],
  },
  {
    subject: "Fen Bilimleri",
    units: [
      {
        name: "1. Ünite: Mevsimler ve İklim",
        outcomes: [
          { code: "F.8.1.1.1", description: "Mevsimlerin oluşumuna yönelik tahminlerde bulunur." },
          { code: "F.8.1.2.1", description: "İklim ve hava olayları arasındaki farkı açıklar." },
          { code: "F.8.1.2.2", description: "İklim biliminin (klimatoloji) bir bilim dalı olduğunu ve bu alanda çalışan uzmanlara iklim bilimci (klimatolog) dendiğini belirtir." },
        ],
      },
      {
        name: "2. Ünite: DNA ve Genetik Kod",
        outcomes: [
          { code: "F.8.2.1.1", description: "Nükleotid, gen, DNA ve kromozom kavramlarını açıklayarak bu kavramlar arasında ilişki kurar." },
          { code: "F.8.2.1.2", description: "DNA'nın yapısını model üzerinde gösterir." },
          { code: "F.8.2.1.3", description: "DNA'nın kendini nasıl eşlediğini ifade eder." },
          { code: "F.8.2.2.1", description: "Kalıtım ile ilgili kavramları tanımlar." },
          { code: "F.8.2.2.2", description: "Tek karakter çaprazlamaları ile ilgili problemler çözerek olasılıkları hesaplar." },
          { code: "F.8.2.2.3", description: "Akraba evliliklerinin genetik sonuçlarını tartışır." },
          { code: "F.8.2.3.1", description: "Mutasyon ve modifikasyon arasındaki farklar ile ilgili çıkarımda bulunur." },
          { code: "F.8.2.4.1", description: "Canlıların yaşadıkları çevreye uyumlarını (adaptasyon) gözlemleyerek örnekler verir." },
          { code: "F.8.2.5.1", description: "Genetik mühendisliği ve biyoteknoloji uygulamalarını ve bu uygulamaların insanlık için önemini tartışır." },
        ],
      },
      {
        name: "3. Ünite: Basınç",
        outcomes: [
          { code: "F.8.3.1.1", description: "Katı basıncını etkileyen değişkenleri deneyerek keşfeder." },
          { code: "F.8.3.1.2", description: "Sıvı basıncını etkileyen değişkenleri tahmin eder ve tahminlerini test eder." },
          { code: "F.8.3.1.3", description: "Katı, sıvı ve gazların basınç özelliklerinin günlük yaşam ve teknolojideki uygulamalarına örnekler verir." },
        ],
      },
      {
        name: "4. Ünite: Madde ve Endüstri",
        outcomes: [
          { code: "F.8.4.1.1", description: "Elementleri periyodik tablo üzerinde metal, yarımetal ve ametal olarak sınıflandırır." },
          { code: "F.8.4.2.1", description: "Fiziksel ve kimyasal değişimler arasındaki farkları gözlem ve deneylerle açıklar." },
          { code: "F.8.4.3.1", description: "Kimyasal tepkimenin oluşumunu deneylerle açıklar." },
          { code: "F.8.4.4.1", description: "Asit ve bazların genel özelliklerini ifade eder." },
          { code: "F.8.4.4.2", description: "Asit ve bazların maddeler üzerindeki etkilerini gözlemler." },
          { code: "F.8.4.4.3", description: "Asit yağmurlarının önlenmesine yönelik çözüm önerileri sunar." },
          { code: "F.8.4.5.1", description: "Maddelerin ısı etkisiyle hâl değişimine yönelik sıcaklık-zaman grafiklerini çizer ve yorumlar." },
          { code: "F.8.4.6.1", description: "Türkiye'deki kimya endüstrisinin gelişimini araştırır ve raporlar." },
        ],
      },
      {
        name: "5. Ünite: Basit Makineler",
        outcomes: [
          { code: "F.8.5.1.1", description: "Basit makinelerin iş kolaylığı sağladığına yönelik çıkarımlarda bulunur." },
          { code: "F.8.5.1.2", description: "Farklı basit makine türlerini (kaldıraç, makara, eğik düzlem, çıkrık, dişli çark ve kasnak) inceleyerek kullanım amaçlarını açıklar." },
        ],
      },
      {
        name: "6. Ünite: Enerji Dönüşümleri ve Çevre Bilimi",
        outcomes: [
          { code: "F.8.6.1.1", description: "Besin zincirindeki üretici, tüketici ve ayrıştırıcıların rollerini açıklar." },
          { code: "F.8.6.2.1", description: "Fotosentezin canlılar için önemini sorgular." },
          { code: "F.8.6.2.2", description: "Solunumun canlılar için önemini açıklar." },
          { code: "F.8.6.3.1", description: "Madde döngülerini şema üzerinde göstererek açıklar." },
          { code: "F.8.6.3.2", description: "Sürdürülebilir kalkınmanın önemini ve geri dönüşümün katkılarını tartışır." },
          { code: "F.8.6.4.1", description: "Küresel iklim değişikliklerinin neden ve sonuçlarını tartışır." },
        ],
      },
      {
        name: "7. Ünite: Elektrik Yükleri ve Elektrik Enerjisi",
        outcomes: [
          { code: "F.8.7.1.1", description: "Elektrik yüklerini ve cisimlerin yük durumlarını açıklar." },
          { code: "F.8.7.2.1", description: "Statik elektriğin günlük yaşam ve teknolojideki uygulamalarına örnekler verir." },
          { code: "F.8.7.3.1", description: "Elektrik enerjisinin ısı, ışık ve hareket enerjisine dönüştüğü uygulamalara örnekler verir." },
          { code: "F.8.7.3.2", description: "Elektrik enerjisinin üretildiği güç santrallerini ve çevreye etkilerini açıklar." },
          { code: "F.8.7.3.3", description: "Elektrik enerjisinin tasarruflu kullanılmasının önemini tartışır." },
        ],
      },
    ],
  },
  {
    subject: "T.C. İnkılap Tarihi ve Atatürkçülük",
    units: [
      {
        name: "1. Ünite: Bir Kahraman Doğuyor",
        outcomes: [
          { code: "İTA.8.1.1", description: "20. yüzyılın başlarında Osmanlı Devleti'nin durumunu analiz eder." },
          { code: "İTA.8.1.2", description: "Mustafa Kemal'in çocukluk dönemini ve öğrenim hayatını etkileyen çevreleri analiz eder." },
          { code: "İTA.8.1.3", description: "Mustafa Kemal'in askerlik hayatı ile ilgili olayları ve bu olayların onun kişilik özelliklerinin oluşumuna etkisini açıklar." },
          { code: "İTA.8.1.4", description: "Mustafa Kemal'in fikir hayatını etkileyen yazar, düşünür ve olayları değerlendirir." },
        ],
      },
      {
        name: "2. Ünite: Millî Uyanış: Bağımsızlık Yolunda Atılan Adımlar",
        outcomes: [
          { code: "İTA.8.2.1", description: "Birinci Dünya Savaşı'nın sebeplerini ve savaşın başlamasına yol açan gelişmeleri kavrar." },
          { code: "İTA.8.2.2", description: "Osmanlı Devleti'nin Birinci Dünya Savaşı'nda mücadele ettiği cepheleri ve bu cephelerin açılma nedenlerini analiz eder." },
          { code: "İTA.8.2.3", description: "Mondros Ateşkes Antlaşması'nın imzalanması ve sonrasındaki işgaller karşısında Osmanlı yönetiminin, Mustafa Kemal'in ve halkın tutumunu analiz eder." },
          { code: "İTA.8.2.4", description: "Kuvâ-yı Millîye'nin oluşum sürecini ve milli cemiyetlerin çalışmalarını değerlendirir." },
          { code: "İTA.8.2.5", description: "Millî Mücadele'nin hazırlık döneminde yapılan çalışmaları (genelgeler ve kongreler) analiz eder." },
          { code: "İTA.8.2.6", description: "Misakımilli'nin kabulünü ve Büyük Millet Meclisinin açılışını milli egemenlik ve milli bağımsızlık ilkeleri çerçevesinde analiz eder." },
          { code: "İTA.8.2.7", description: "Büyük Millet Meclisine karşı çıkan ayaklanmalar ile ayaklanmaların bastırılması için alınan tedbirleri analiz eder." },
          { code: "İTA.8.2.8", description: "Sevr Antlaşması'nın imzalanması ve bu antlaşmaya karşı Türk milletinin tepkisini değerlendirir." },
        ],
      },
      {
        name: "3. Ünite: Ya İstiklal Ya Ölüm!",
        outcomes: [
          { code: "İTA.8.3.1", description: "Doğu ve Güney cephelerinde yapılan mücadeleleri ve bu mücadelelerin sonuçlarını analiz eder." },
          { code: "İTA.8.3.2", description: "Batı Cephesi'nde askeri mücadeleleri ve bu mücadelelerin sonuçlarını analiz eder." },
          { code: "İTA.8.3.3", description: "Maarif Kongresi'nin toplanma amacını ve önemini eğitim politikası açısından değerlendirir." },
          { code: "İTA.8.3.4", description: "Tekalif-i Milliye Emirleri'nin yayımlanması ve uygulanmasını Türk milletinin fedakarlığı açısından analiz eder." },
          { code: "İTA.8.3.5", description: "Sakarya Meydan Muharebesi ve Büyük Taarruz'un kazanılmasında Mustafa Kemal'in rolünü ve askeri dehasını açıklar." },
          { code: "İTA.8.3.6", description: "Mudanya Ateşkes Antlaşması ve Lozan Barış Antlaşması'nın askeri ve siyasi başarılarını değerlendirir." },
          { code: "İTA.8.3.7", description: "Millî Mücadele'nin sanat ve edebiyat eserlerine yansımalarına örnekler verir." },
        ],
      },
      {
        name: "4. Ünite: Atatürkçülük ve Çağdaşlaşan Türkiye",
        outcomes: [
          { code: "İTA.8.4.1", description: "Siyasi alanda meydana gelen gelişmeleri (saltanatın kaldırılması, Ankara'nın başkent oluşu, cumhuriyetin ilanı, halifeliğin kaldırılması) analiz eder." },
          { code: "İTA.8.4.2", description: "Hukuk alanında meydana gelen gelişmeleri (Teşkilat-ı Esasiye Kanunu, Türk Medeni Kanunu vb.) analiz eder." },
          { code: "İTA.8.4.3", description: "Eğitim ve kültür alanında yapılan inkılapları (Tevhid-i Tedrisat Kanunu, Harf İnkılabı, Türk Tarih ve Dil Kurumlarının kurulması vb.) analiz eder." },
          { code: "İTA.8.4.4", description: "Toplumsal alanda yapılan inkılapları (Şapka ve Kıyafet İnkılabı, Tekke ve Zaviyelerin kapatılması, Takvim, Saat ve Ölçülerde değişiklik, Soyadı Kanunu vb.) analiz eder." },
          { code: "İTA.8.4.5", description: "Ekonomi alanında yapılan gelişmeleri (İzmir İktisat Kongresi, Kabotaj Kanunu, tarım, sanayi ve ticaret adımları) analiz eder." },
          { code: "İTA.8.4.6", description: "Sağlık alanında yapılan çalışmaları devletin temel görevleri çerçevesinde değerlendirir." },
          { code: "İTA.8.4.7", description: "Atatürk ilkelerini (Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik, İnkılapçılık) temel özellikleri ve önemleri ile açıklar." },
          { code: "İTA.8.4.8", description: "Atatürk Dönemi'nde Türk kadınına sağlanan siyasi ve sosyal hakları dünya genelindeki gelişmelerle karşılaştırarak değerlendirir." },
        ],
      },
      {
        name: "5. Ünite: Demokratikleşme Çabaları",
        outcomes: [
          { code: "İTA.8.5.1", description: "Atatürk Dönemi'ndeki çok partili hayata geçiş denemelerini ve bu denemelerin başarısız olma nedenlerini analiz eder." },
          { code: "İTA.8.5.2", description: "Mustafa Kemal'e yönelik suikast girişimini ve cumhuriyete yönelik tehditleri analiz eder." },
          { code: "İTA.8.5.3", description: "Şeyh Sait İsyanı ve Menemen Olayı'nı demokratik ve laik devlete yönelik tehditler bağlamında değerlendirir." },
        ],
      },
      {
        name: "6. Ünite: Atatürk Dönemi Türk Dış Politikası",
        outcomes: [
          { code: "İTA.8.6.1", description: "Atatürk Dönemi Türk dış politikasının temel ilkelerini ve amaçlarını analiz eder." },
          { code: "İTA.8.6.2", description: "Atatürk Dönemi dış politikasındaki gelişmeleri (Yabancı Okullar, Musul Sorunu, Nüfus Mübadelesi, Milletler Cemiyeti, Balkan Antantı, Sadabat Paktı, Montrö Boğazlar Sözleşmesi) analiz eder." },
          { code: "İTA.8.6.3", description: "Atatürk'ün Hatay'ı anavatana katma mücadelesini ve bu uğurdaki özverisini değerlendirir." },
        ],
      },
      {
        name: "7. Ünite: Atatürk'ün Ölümü ve Sonrası",
        outcomes: [
          { code: "İTA.8.7.1", description: "Atatürk'ün ölümünün yankılarını ve onun fikirlerinin evrensel değerini değerlendirir." },
          { code: "İTA.8.7.2", description: "Atatürk'ün Türk milletine bıraktığı eserleri ve mirasları örneklerle açıklar." },
          { code: "İTA.8.7.3", description: "İkinci Dünya Savaşı öncesi gelişmeler, savaşta Türkiye'nin izlediği denge siyaseti ve savaşın Türkiye'ye etkilerini analiz eder." },
        ],
      },
    ],
  },
  {
    subject: "Din Kültürü ve Ahlak Bilgisi",
    units: [
      {
        name: "1. Ünite: Kader İnancı",
        outcomes: [
          { code: "8.1.1", description: "Kader ve kaza kavramlarını ayet ve hadislerle açıklar." },
          { code: "8.1.2", description: "İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar." },
          { code: "8.1.3", description: "Kaderle ilgili bazı kavramları (ecel, ömür, rızık, tevekkül, başarı, başarısızlık, sağlık, hastalık) ayet ve hadisler ışığında analiz eder." },
          { code: "8.1.4", description: "Hz. Musa'nın (a.s.) hayatını ana hatlarıyla tanır." },
          { code: "8.1.5", description: "Ayetü'l-Kürsi'yi okur, anlamını açıklar ve içerdiği mesajları değerlendirir." },
        ],
      },
      {
        name: "2. Ünite: Zekât ve Sadaka",
        outcomes: [
          { code: "8.2.1", description: "İslam'ın paylaşma ve yardımlaşmaya verdiği önemi ayet ve hadislerle açıklar." },
          { code: "8.2.2", description: "Zekat ve sadaka ibadetini ayet ve hadislerle açıklar." },
          { code: "8.2.3", description: "Zekat, sadaka ve fıtır sadakasının bireysel ve toplumsal faydalarını değerlendirir." },
          { code: "8.2.4", description: "Hz. Şuayb'ın (a.s.) hayatını ana hatlarıyla tanır." },
          { code: "8.2.5", description: "Maûn suresini okur, anlamını açıklar ve içerdiği mesajları değerlendirir." },
        ],
      },
      {
        name: "3. Ünite: Din ve Hayat",
        outcomes: [
          { code: "8.3.1", description: "Dinin tanımını, kaynağını ve amacını açıklar." },
          { code: "8.3.2", description: "İslam dininin can, nesil, akıl, mal ve din emniyeti ile ilgili ortaya koyduğu ilke ve amaçları analiz eder." },
          { code: "8.3.3", description: "Dinin birey ve toplum üzerindeki etkisini ve ahlaki değerlerle ilişkisini açıklar." },
          { code: "8.3.4", description: "Hz. Yusuf'un (a.s.) hayatını ana hatlarıyla tanır." },
          { code: "8.3.5", description: "Asr suresini okur, anlamını açıklar ve içerdiği mesajları değerlendirir." },
        ],
      },
      {
        name: "4. Ünite: Hz. Muhammed'in Örnekliği",
        outcomes: [
          { code: "8.4.1", description: "Hz. Muhammed'in (s.a.v.) davasındaki cesaret ve kararlılığını örneklerle açıklar." },
          { code: "8.4.2", description: "Hz. Muhammed'in (s.a.v.) istişareye verdiği önemi örneklerle açıklar." },
          { code: "8.4.3", description: "Hz. Muhammed'in (s.a.v.) merhametli, affedici, adil ve güvenilir oluşunu örneklerle açıklar." },
          { code: "8.4.4", description: "Hz. Muhammed'in (s.a.v.) insanlara değer vermesini ve doğayı korumasını örneklerle açıklar." },
          { code: "8.4.5", description: "Kureyş suresini okur, anlamını açıklar ve içerdiği mesajları değerlendirir." },
        ],
      },
      {
        name: "5. Ünite: Kur'an-ı Kerim ve Özellikleri",
        outcomes: [
          { code: "8.5.1", description: "İslam dininin temel kaynaklarını tanır." },
          { code: "8.5.2", description: "Ayetlerden hareketle Kur'an'ın ana konularını sınıflandırır." },
          { code: "8.5.3", description: "Kur'an-ı Kerim'in temel özelliklerini değerlendirir." },
          { code: "8.5.4", description: "Hz. Nuh'un (a.s.) hayatını ana hatlarıyla tanır." },
        ],
      },
    ],
  },
  {
    subject: "İngilizce",
    units: [
      {
        name: "Unit 1: Friendship",
        outcomes: [
          { code: "E8.1.L1", description: "Students will be able to understand the structure of an invitation and make/accept/refuse simple invitations." },
          { code: "E8.1.SI1", description: "Students will be able to talk about personal characteristics and friendships." },
          { code: "E8.1.SP1", description: "Students will be able to make simple inquiries about future plans." },
          { code: "E8.1.R1", description: "Students will be able to understand short, simple texts about friendship and invitations." },
          { code: "E8.1.W1", description: "Students will be able to write short, simple invitation cards or emails." },
        ],
      },
      {
        name: "Unit 2: Teen Life",
        outcomes: [
          { code: "E8.2.L1", description: "Students will be able to understand people's regular activities and daily routines." },
          { code: "E8.2.SI1", description: "Students will be able to express their likes, dislikes, preferences and interests." },
          { code: "E8.2.SP1", description: "Students will be able to talk about regular/daily activities of teens." },
          { code: "E8.2.R1", description: "Students will be able to read and understand short, simple texts about preferences and daily routines." },
          { code: "E8.2.W1", description: "Students will be able to write short paragraphs about their preferences and routines." },
        ],
      },
      {
        name: "Unit 3: In the Kitchen",
        outcomes: [
          { code: "E8.3.L1", description: "Students will be able to understand simple instructions for cooking and food preparation." },
          { code: "E8.3.SI1", description: "Students will be able to ask/answer questions about recipes, ingredients, and cooking processes." },
          { code: "E8.3.SP1", description: "Students will be able to describe simple processes of making dishes." },
          { code: "E8.3.R1", description: "Students will be able to follow simple instructions/recipes in a text." },
          { code: "E8.3.W1", description: "Students will be able to write a simple recipe." },
        ],
      },
      {
        name: "Unit 4: On the Phone",
        outcomes: [
          { code: "E8.4.L1", description: "Students will be able to follow simple phone conversations." },
          { code: "E8.4.SI1", description: "Students will be able to make simple phone calls, leave messages, and ask for clarification." },
          { code: "E8.4.SP1", description: "Students will be able to express plans, intentions, and future events." },
          { code: "E8.4.R1", description: "Students will be able to read and understand short, simple phone messages and dialogues." },
          { code: "E8.4.W1", description: "Students will be able to write short messages or emails to friends." },
        ],
      },
      {
        name: "Unit 5: The Internet",
        outcomes: [
          { code: "E8.5.L1", description: "Students will be able to understand simple explanations about internet safety and usage." },
          { code: "E8.5.SI1", description: "Students will be able to talk about internet habits, online activities, and preferences." },
          { code: "E8.5.SP1", description: "Students will be able to ask for clarification on internet terms." },
          { code: "E8.5.R1", description: "Students will be able to understand basic instructions on websites and short online texts." },
          { code: "E8.5.W1", description: "Students will be able to write short posts or comments on social media." },
        ],
      },
      {
        name: "Unit 6: Adventures",
        outcomes: [
          { code: "E8.6.L1", description: "Students will be able to understand short presentations or conversations about extreme sports and adventures." },
          { code: "E8.6.SI1", description: "Students will be able to compare different activities and sports." },
          { code: "E8.6.SP1", description: "Students will be able to express preferences and opinions about extreme activities." },
          { code: "E8.6.R1", description: "Students will be able to read and understand texts comparing different sports/places." },
          { code: "E8.6.W1", description: "Students will be able to write a short paragraph about an adventure or dream sport." },
        ],
      },
      {
        name: "Unit 7: Tourism",
        outcomes: [
          { code: "E8.7.L1", description: "Students will be able to understand information in tourist brochures, audios, or videos." },
          { code: "E8.7.SI1", description: "Students will be able to talk about past holidays, destinations, and experiences." },
          { code: "E8.7.SP1", description: "Students will be able to describe historical sites, tourist attractions, and weather." },
          { code: "E8.7.R1", description: "Students will be able to understand short, simple tourist guides or brochures." },
          { code: "E8.7.W1", description: "Students will be able to write a postcard or a short review of a visited place." },
        ],
      },
      {
        name: "Unit 8: Chores",
        outcomes: [
          { code: "E8.8.L1", description: "Students will be able to understand requests and obligations regarding household duties." },
          { code: "E8.8.SI1", description: "Students will be able to talk about responsibilities, obligations, and chores." },
          { code: "E8.8.SP1", description: "Students will be able to express rules and feelings about chores." },
          { code: "E8.8.R1", description: "Students will be able to read and understand simple texts/tables about chore division." },
          { code: "E8.8.W1", description: "Students will be able to write a simple list of chores or a diary entry." },
        ],
      },
      {
        name: "Unit 9: Science",
        outcomes: [
          { code: "E8.9.L1", description: "Students will be able to understand short talks or presentations on scientific developments." },
          { code: "E8.9.SI1", description: "Students will be able to talk about scientific actions, experiments, and famous scientists." },
          { code: "E8.9.SP1", description: "Students will be able to describe ongoing scientific research or historical inventions." },
          { code: "E8.9.R1", description: "Students will be able to read and understand simple articles about science and technology." },
          { code: "E8.9.W1", description: "Students will be able to write short paragraphs about scientific inventions." },
        ],
      },
      {
        name: "Unit 10: Natural Forces",
        outcomes: [
          { code: "E8.10.L1", description: "Students will be able to understand reports or discussions about natural disasters and environmental issues." },
          { code: "E8.10.SI1", description: "Students will be able to talk about natural disasters, causes, and consequences." },
          { code: "E8.10.SP1", description: "Students will be able to express predictions and concerns about the future of the earth." },
          { code: "E8.10.R1", description: "Students will be able to read and understand short texts, news, or posters about natural events." },
          { code: "E8.10.W1", description: "Students will be able to write a basic warning or a simple plan to protect nature." },
        ],
      },
    ],
  },
];
