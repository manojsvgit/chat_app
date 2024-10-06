// Switch between Sign-up and Sign-in modes
const sign_up_btn = document.querySelector("#sign-up-btn");
const sign_in_btn = document.querySelector("#sign-in-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting in the traditional way
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Simple validation
    if (username && password) {
        try {
            const response = await fetch('/api/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Successful login
                console.log("Logged in as:", username);
                localStorage.setItem('nickname', username); // Store username locally
                
                // Redirect to chat.html after successful login
                window.location.href = 'chat.html';
            } else {
                alert(data.message); // Show error message from the server
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('Error logging in. Please try again later.');
        }
    } else {
        alert('Please enter both username and password.');
    }
});

// Handle sign-up form submission
document.getElementById('register-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting in the traditional way
    
    const signupUsername = document.getElementById('register-username').value; // Updated to match your HTML input ID
    const signupEmail = document.getElementById('register-email').value; // Added email input
    const signupPassword = document.getElementById('register-password').value; // Updated to match your HTML input ID

    // Simple validation for signup form
    if (signupUsername && signupEmail && signupPassword) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: signupUsername, email: signupEmail, password: signupPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                // Successful registration
                localStorage.setItem('nickname', signupUsername); // Store username locally
                
                // Redirect to chat.html after signup
                window.location.href = 'chat.html';
            } else {
                alert(data.error); // Show error message from the server
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('Error signing up. Please try again later.');
        }
    } else {
        alert('Please fill in all fields to sign up.');
    }
});

// jQuery for mobile navigation and search toggle (if used in your app)
$("#search-icon").click(function() {
    $(".nav").toggleClass("search");
    $(".nav").toggleClass("no-search");
    $(".search-input").toggleClass("search-active");
});

$('.menu-toggle').click(function() {
    $(".nav").toggleClass("mobile-nav");
    $(this).toggleClass("is-active");
});
