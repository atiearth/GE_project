//like action
const likePost = async (postId) => {
    try {
        const response = await fetch(`/post/like/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to like the post');
        }
        const data = await response.json();

        // Update like count
        document.getElementById(`like-count-${postId}`).innerText = data.likes;

        // Update heart icon based on like status
        const heartIcon = document.getElementById(`heartIcon-${postId}`);
        const loveButton = document.getElementById(`loveBtn-${postId}`);

        heartIcon.classList.remove('fas', 'far')

        if (data.like_status === 'like') {
            heartIcon.classList.add('fas');
            loveButton.classList.add('loved'); // Add 'loved' class
        } else {
            heartIcon.classList.add('far');
            loveButton.classList.remove('loved')
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

//delete action
const deletePost = async (post_id) => {
    try {
        const response = await fetch(`/post/delete/${post_id}`, {
            method: 'DELETE'
        })
        document.getElementById(`post-${post_id}`).remove()
    } catch (err) {
        console.error("Error : ", err)
    }
}

//resize textarea action
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    autoResizeTextarea(textarea);
});