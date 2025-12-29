document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("title").textContent = "Hello";
    console.log("Change Hello CI to Hello");
});
const button = document.getElementById("testbutton");
document.addEventListener("click", () => {
    button.textContent = "Danke fuer den Klick";
});
