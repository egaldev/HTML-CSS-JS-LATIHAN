const menuBtn = document.querySelector("#menuBtn");
const navLinks = document.querySelector("#navLinks");
const icon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    console.log("clicked");

    if (navLinks.classList.contains("active")) {
        icon.classList.replace("fa-bars", "fa-xmark");
    } else {
        icon.classList.replace("fa-xmark", "fa-bars");
    }
});
