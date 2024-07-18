let selections = {}; // Kullanıcı seçimlerini saklayacak nesne

// Adım çizgilerini güncelle
function updateStepIndicators(stepNumber) { 
  const indicators = document.querySelectorAll('.step-indicator'); 
  indicators.forEach((indicator, index) => { 
    if (index <= stepNumber) { 
      indicator.classList.add('active'); // Geçerli ve önceki adımları aktif olarak işaretle
    } else { 
      indicator.classList.remove('active'); // Sonraki adımları pasif olarak işaretle
    } 
  }); 
}

// Belirli bir adımı ve ilgili verileri almak için fonksiyon
function getStep(stepNumber, data, checkedCategory) {
  // Tüm adımlardan 'active' sınıfını kaldır
  const allSteps = document.querySelectorAll('.step');
  allSteps.forEach(step => {
    step.classList.remove('active');
  });

  // Geçerli adımı seçip 'active' sınıfını ekle
  const step = document.querySelector(`.step[data-step="${stepNumber}"]`);
  step.classList.add('active');

  // Geçerli adımın verilerini alın
  let relevantData;
  if (stepNumber === 0) {
    relevantData = data[0].steps[0]; // İlk adım için genel veri yapısını al
  } else {
    const categoryData = data.find(d => d.name === checkedCategory); // Seçilen kategoriye göre veri bul
    if (!categoryData) {
      console.error('Category data not found for:', checkedCategory);
      return;
    }
    relevantData = categoryData.steps[stepNumber]; // İlgili kategoriye göre adım verisini al
    console.log('Checked Category:', checkedCategory);
    console.log('Relevant Data:', relevantData);
  }

  if (!relevantData) {
    console.error('Relevant data not found for step number:', stepNumber, 'and category:', checkedCategory);
    return;
  }

  const title = relevantData.title;
  const subtitle = relevantData.subtitle;
  const answers = relevantData.answers;

  document.querySelector(`.step[data-step="${stepNumber}"] .title`).textContent = title;
  document.querySelector(`.step[data-step="${stepNumber}"] .subtitle`).textContent = subtitle;

  const answersContainer = step.querySelector('.answers');
  answersContainer.innerHTML = '';

  // Cevapları oluştur
  answers.forEach(answer => {
    const radioElement = document.createElement('input');
    radioElement.type = "radio";
    radioElement.name = relevantData.type; // Radio grubu adını belirt
    radioElement.id = answer;

    // Adım numarasına göre özel sınıf ekleme
    if (stepNumber === 0) {
      radioElement.classList.add('radiostep1'); 
    } else if (stepNumber === 2) {
      radioElement.classList.add('radiostep3'); 
    } else {
      radioElement.classList.add('radiostep2'); 
    }

    const labelElement = document.createElement('label');
    labelElement.htmlFor = answer;
    
    // Renk seçimi değilse cevap metnini belirle
    if (radioElement.name !== 'color') {
      labelElement.textContent = answer;
    }
    
    // Renk seçimi ise arka plan rengini belirle
    if (radioElement.name === 'color') {
      labelElement.style.backgroundColor = radioElement.id;
    }

    // Seçili cevabı işaretleyin
    if (selections[stepNumber] === answer) {
      radioElement.checked = true;
    }

    // HTML'e cevapları ekle
    answersContainer.append(radioElement);
    answersContainer.append(labelElement);
  });

  updateStepIndicators(stepNumber); // Adım göstergelerini güncelle
}

// Ürün verilerini getirmek için asenkron fonksiyon
async function getProducts() {
  const res = await fetch("./products.json");
  const products = await res.json();
  return products; // Ürün verilerini döndür
}

// Ana işlemi yürüten fonksiyon
async function main() {
  // Soru verilerini getir
  const res = await fetch("./questions.json");
  const data = await res.json();
  console.log(data);

  // Ürün verilerini getir
  const products = await getProducts();
  console.log(products);

  let currentStep = 0; // Başlangıç adımı
  let checkedCategory = null; // Seçilen kategori

  // İlk adımı görüntüle
  getStep(currentStep, data);

  // 'İleri' butonuna tıklama olayı ekle
  document.querySelector('.next-button').addEventListener('click', function() {
    const currentStepElement = document.querySelector(`.step[data-step="${currentStep}"]`);
    const selectedRadio = currentStepElement.querySelector('input[type="radio"]:checked');
    
    // Seçim yapılmadıysa uyarı ver ve fonksiyondan çık
    if (!selectedRadio) {
      alert("Lütfen bir seçim yapın.");
      return;
    }

    // Kullanıcının seçimini kaydet
    selections[currentStep] = selectedRadio.id;

    // Adıma göre seçim işlemlerini yönlendir
    if (currentStep === 0) {
      checkedCategory = selectedRadio.id; // Kategori seçimini sakla
      console.log('Checked Category:', checkedCategory);
    } else if (currentStep === 1) {
      selections.color = selectedRadio.id; // Renk seçimini sakla
      console.log('Selected Color:', selections.color);
    } else if (currentStep === 2) {
      selections.priceRange = selectedRadio.id; // Fiyat aralığı seçimini sakla
      console.log('Selected Price Range:', selections.priceRange);
      
      // Ürünleri filtreleyerek göster
      const filteredProducts = filterProducts(products, selections);
      console.log('Filtered Products:', filteredProducts);
      displayProducts(filteredProducts);
    }

    // Son adıma ulaşılmadıysa bir sonraki adıma geç
    if (currentStep < 3) {
      currentStep++;
      getStep(currentStep, data, checkedCategory);
      
      // Son adıma gelindiğinde 'İleri' ve 'Geri' butonlarını gizle
      if (currentStep === 3) {
        document.querySelector('.next-button').style.display = 'none';
        document.querySelector('.back-button').style.display = 'none';
        document.querySelector('.step-indicator-container').style.display = 'none';
      }
    } 
  });

  // 'Geri' butonuna tıklama olayı ekle
  document.querySelector('.back-button').addEventListener('click', function() {
    if (currentStep > 0) {
      currentStep--; // Bir önceki adıma geç
      getStep(currentStep, data, checkedCategory);
    }
  });
}

// Ürünleri seçilen özelliklere göre filtreleyen fonksiyon
function filterProducts(products, selections) {
  const priceRange = selections.priceRange.split('-');
  const minPrice = parseFloat(priceRange[0]);
  const maxPrice = priceRange[1] ? parseFloat(priceRange[1]) : Infinity;

  return products.filter(product => {
    // Ürün kategorisi, renk ve fiyat aralığına göre eşleşen ürünleri filtrele
    const matchesCategory = product.category.includes(selections[0]);
    const matchesColor = product.colors.includes(selections.color.toLowerCase());
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchesCategory && matchesColor && matchesPrice;
  });
}

let swiper; // Swiper nesnesi

// Ürünleri gösteren fonksiyon
function displayProducts(products) {
  const swiperWrapper = document.querySelector('.swiper-wrapper');

  // Önceki ürünleri temizle
  swiperWrapper.innerHTML = '<div id="loading">LOADİNG..</div>';
  
  setTimeout(function() {
    // Filtrelenmiş ürün yoksa uygun mesaj göster
    swiperWrapper.innerHTML = '';
    if (products.length === 0) {
      const noProductMessage = document.createElement('div');
      noProductMessage.classList.add('swiper-slide');
      noProductMessage.textContent = 'Üzgünüz, seçtiğiniz filtrelerle eşleşen ürün bulunamadı.';
      swiperWrapper.append(noProductMessage);
    } else {
      // Her bir ürün için swiper slaydı oluştur
      products.forEach(product => {
        const swiperSlide = document.createElement('div');
        swiperSlide.classList.add('swiper-slide');

        const productElement = document.createElement('div');
        productElement.classList.add('product');

        const productImage = document.createElement('img');
        productImage.src = product.image;
        productImage.alt = product.name;

        const productDetails = document.createElement('div');
        productDetails.classList.add('product-details');

        const productTitle = document.createElement('h2');
        productTitle.textContent = product.name;
        productTitle.style.marginTop = '30px';

        const productOldPrice = document.createElement('p');
        if (product.oldPrice) {
          productOldPrice.textContent = `Eski Fiyat: ${product.oldPrice} ${product.currency}`;
          productOldPrice.classList.add('old-price');
          productOldPrice.style.textDecoration = 'line-through';
          productOldPrice.style.color = 'red';
        }

        const productPrice = document.createElement('p');
        productPrice.textContent = `Fiyat: ${product.price} ${product.currency}`;
        productPrice.style.fontWeight = 'bold';

        // 'Ürüne Git' butonu oluştur ve sınıf ekle
        const goToProductButton = document.createElement('button');
        goToProductButton.textContent = 'Ürüne Git';
        goToProductButton.classList.add('go-to-product-button');

        // 'Ürüne Git' butonu tıklama olayı
        goToProductButton.addEventListener('click', () => {
          window.location.href = product.url;
        });

        let swiperButtons = document.querySelectorAll('.swiper-btn-disabled');
        swiperButtons.forEach(swiperButton => {
          swiperButton.classList.remove('swiper-btn-disabled');
        });

        productDetails.append(productTitle, productOldPrice, productPrice, goToProductButton);
        productElement.append(productImage, productDetails);
        swiperSlide.append(productElement);
        swiperWrapper.append(swiperSlide);
      });
    }

    // Swiper nesnesini yeniden oluştur
    if (swiper) {
      swiper.destroy();
    }

    swiper = new Swiper(".swiper", {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true, // Slayt döngüsü etkinleştir
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
    });
  }, 2000)
}

// Ana işlemi başlat
main();
