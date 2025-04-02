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

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            let errorMessage = "";

            if (!email || !password) {
                errorMessage = "Please fill in all fields.";
            }

            if (errorMessage) {
                event.preventDefault(); // Prevent form submission
                displayError(errorMessage); // Show error message
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirmPassword").value.trim();
            const agreement = document.getElementById("agreement").checked;
            let errorMessage = "";

            // Validation checks
            if (!email || !password || !confirmPassword) {
                errorMessage = "All fields are required.";
            } else if (password !== confirmPassword) {
                errorMessage = "Passwords do not match.";
            } else if (!agreement) {
                errorMessage = "You must agree to the terms.";
            }

            if (errorMessage) {
                event.preventDefault(); // Prevent form submission
                displayError(errorMessage);
            }
        });
    }

    function displayError(message) {
        let errorBox = document.getElementById("error-msg");

        if (!errorBox) {
            errorBox = document.createElement("p");
            errorBox.id = "error-msg";
            errorBox.classList.add("error");
            const form = document.querySelector("form");
            form.insertBefore(errorBox, form.firstChild);
        }

        errorBox.textContent = message;
    }
});
