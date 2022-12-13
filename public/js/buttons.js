function setActive(mode) {
    console.log(mode);
    if(mode === "ffa") {
        document.getElementById('mode_ffa').classList.add("active");
        document.getElementById('mode_competitive').classList.remove("active");
    } else if(mode === "competitive") {
        document.getElementById('mode_competitive').classList.add("active");
        document.getElementById('mode_ffa').classList.remove("active");
    }
}

function hint(mode) {
    // TODO 
}