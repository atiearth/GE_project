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

