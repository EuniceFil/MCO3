document.addEventListener("DOMContentLoaded", function () {
    const viewpostbutton = document.getElementById("viewpostbutton");
    const viewcommentbutton = document.getElementById("viewcommentbutton");

    const viewuserpost = document.getElementById("viewuserpost");
    const viewusercomment = document.getElementById("viewusercomment");

    // Ensure elements exist before using them
    if (viewuserpost) viewuserpost.style.display = "block";
    if (viewusercomment) viewusercomment.style.display = "none";

    if (viewpostbutton && viewcommentbutton) {
        viewpostbutton.addEventListener("click", () => {
            if (viewuserpost) viewuserpost.style.display = "block";
            if (viewusercomment) viewusercomment.style.display = "none";
        });

        viewcommentbutton.addEventListener("click", () => {
            if (viewuserpost) viewuserpost.style.display = "none";
            if (viewusercomment) viewusercomment.style.display = "block";
        });
    }

    // Hide buttons if the sections are empty
    if (viewpostbutton && (!viewuserpost || viewuserpost.innerHTML.trim() === "")) {
        viewpostbutton.style.display = "none";
    }

    if (viewcommentbutton && (!viewusercomment || viewusercomment.innerHTML.trim() === "")) {
        viewcommentbutton.style.display = "none";
    }
});

function toggleComments(button) {
    const commentSection = button.parentNode.nextElementSibling;
    if (commentSection) {
        if (commentSection.style.display === "none") {
            commentSection.style.display = "block";
        } else {
            commentSection.style.display = "none";
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("changepic");
    const profileImage = document.querySelector(".userpic");

    if (fileInput) {
        fileInput.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profileImage.src = e.target.result; // Update the profile pic preview
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

