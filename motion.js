//alert motion
function showAlert(type, message) {
    var alertBox = document.getElementById('alert-box');
    alertBox.className = 'alert ' + (type === 'error' ? 'alert-error' : 'alert-success');
    alertBox.textContent = message;
    alertBox.style.display = 'block';
}

const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
if (error) {
    showAlert('error', decodeURIComponent(error));
}

//like motion
document.addEventListener('DOMContentLoaded', function () {
    function toggleLike(button) {
        const heartIcon = button.querySelector('.heart-icon');
        if (heartIcon.classList.contains('far')) {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
        } else {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
        }
        button.classList.toggle('loved');
    }

    document.querySelectorAll('.love-button').forEach(button => {
        button.addEventListener('click', function () {
            toggleLike(this);
        });
    });
});

