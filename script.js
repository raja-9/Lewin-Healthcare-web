let doctors = JSON.parse(localStorage.getItem("doctors")) || [];
let currentDoctor = null;
let currentSlide = 0;

// Elements
const homePage = document.getElementById("homePage");
const slideshowPage = document.getElementById("slideshowPage");
const doctorList = document.getElementById("doctorList");
const slidesContainer = document.getElementById("slidesContainer");
const slideCounter = document.getElementById("slideCounter");
const doctorNameHeading = document.getElementById("doctorName");

// Render Doctors
function renderDoctors() {
  doctorList.innerHTML = "";
  doctors.forEach((doc, index) => {
    const card = document.createElement("div");
    card.classList.add("doctor-card");

    const name = document.createElement("span");
    name.textContent = doc.name;
    card.appendChild(name);

    // Long press to show delete button
    let pressTimer;
    card.addEventListener("mousedown", startPress);
    card.addEventListener("touchstart", startPress);
    card.addEventListener("mouseup", cancelPress);
    card.addEventListener("mouseleave", cancelPress);
    card.addEventListener("touchend", cancelPress);

    function startPress() {
      pressTimer = setTimeout(() => {
        showDeleteButton();
      }, 1500); // 1.5 seconds hold
    }

    function cancelPress() {
      clearTimeout(pressTimer);
    }

    function showDeleteButton() {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete Doctor";
      delBtn.classList.add("delete-text-btn");

      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete doctor "${doc.name}"?`)) {
          doctors.splice(index, 1);
          saveDoctors();
          renderDoctors();
        }
      };

      // Avoid adding multiple delete buttons
      if (!card.querySelector(".delete-text-btn")) {
        card.appendChild(delBtn);
      }
    }

    // Normal click opens slideshow
    card.onclick = () => openSlideshow(index);

    doctorList.appendChild(card);
  });
}



// Add Doctor
document.getElementById("addDoctorBtn").addEventListener("click", () => {
  const name = prompt("Enter Doctor's Name:");
  if (name) {
    doctors.push({ name, images: [] });
    saveDoctors();
    renderDoctors();
  }
});

// Open Slideshow
function openSlideshow(index) {
  currentDoctor = index;
  currentSlide = 0;
  homePage.style.display = "none";
  slideshowPage.style.display = "block";
  doctorNameHeading.textContent = doctors[index].name;
  renderSlides();
}

// Render Slides
function renderSlides() {
  const doctor = doctors[currentDoctor];
  slidesContainer.innerHTML = "";

  if (doctor.images.length === 0) {
    slidesContainer.innerHTML = "<p style='color:gray;'>No images added yet</p>";
    slideCounter.textContent = "0 / 0";
    return;
  }

  doctor.images.forEach((src, i) => {
    const slide = document.createElement("div");
    slide.classList.add("slide");
    if (i === currentSlide) slide.classList.add("active");

    const img = document.createElement("img");
    img.src = src;
    slide.appendChild(img);
    slidesContainer.appendChild(slide);
  });

  slideCounter.textContent = `${currentSlide + 1} / ${doctor.images.length}`;
}

// Add Images
document.getElementById("addImageBtn").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    const readerPromises = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readerPromises).then(base64Images => {
      doctors[currentDoctor].images.push(...base64Images);
      saveDoctors();
      renderSlides();
    });
  };
  input.click();
});

// Navigation
document.getElementById("nextBtn").addEventListener("click", () => {
  const doctor = doctors[currentDoctor];
  if (currentSlide < doctor.images.length - 1) {
    currentSlide++;
    renderSlides();
  }
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentSlide > 0) {
    currentSlide--;
    renderSlides();
  }
});

// Back Button
document.getElementById("backBtn").addEventListener("click", () => {
  slideshowPage.style.display = "none";
  homePage.style.display = "block";
  currentDoctor = null;
  saveDoctors();
});

// Fullscreen Toggle
document.getElementById("fullscreenBtn").addEventListener("click", () => {
  const elem = slidesContainer;
  if (!document.fullscreenElement) {
    elem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Save Data
function saveDoctors() {
  localStorage.setItem("doctors", JSON.stringify(doctors));
}

// 💾 BACKUP - Download JSON file
document.getElementById("backupBtn").addEventListener("click", () => {
  const dataStr = JSON.stringify(doctors);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "doctor_data_backup.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("Backup created successfully!");
});

// 📂 RESTORE - Load data from JSON
document.getElementById("restoreBtn").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          doctors = importedData;
          saveDoctors();
          renderDoctors();
          alert("Data restored successfully!");
        } else {
          alert("Invalid file format!");
        }
      } catch (error) {
        alert("Error reading file!");
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

// Enable Swipe Even in Fullscreen
let startX = 0;
function enableSwipe() {
  slidesContainer.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });
  slidesContainer.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    if (endX < startX - 50) document.getElementById("nextBtn").click();
    if (endX > startX + 50) document.getElementById("prevBtn").click();
  });
}

// Reattach swipe events every time slideshow opens
document.addEventListener("fullscreenchange", enableSwipe);
enableSwipe();


// Initial Render
renderDoctors();
