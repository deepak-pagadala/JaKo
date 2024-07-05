document.addEventListener('DOMContentLoaded', (event) => {
    if (!document.getElementById('background-music')) {
        const audioElement = document.createElement('audio');
        audioElement.src = '/static/audio.mp3';
        audioElement.loop = true;
        audioElement.volume = 0.15; // Set volume to 30%
        audioElement.id = 'background-music';
        document.body.appendChild(audioElement);

        if (typeof Storage !== "undefined") {
            if (!sessionStorage.getItem("musicPlayed")) {
                audioElement.play();
                sessionStorage.setItem("musicPlayed", "true");
            }
        } else {
            audioElement.play();
        }
    }
});
