var players = {};

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
function onYouTubeIframeAPIReady() {
    console.log("YouTube IFrame API Ready");

    // List of all video IDs used in the HTML
    const videoIds = [
        'yt-lyric-1', 'yt-lyric-2', 'yt-lyric-3', 'yt-lyric-4',
        'yt-drone-1', 'yt-drone-2', 'yt-drone-3',
        'yt-mix-1', 'yt-mix-2', 'yt-mix-3'
    ];

    videoIds.forEach(function (elementId) {
        // Check if element exists to avoid errors
        if (document.getElementById(elementId)) {
            players[elementId] = new YT.Player(elementId, {
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        }
    });
}

// When a player state changes (e.g. playing, paused, finished)
function onPlayerStateChange(event) {
    // If the video is PLAYING (state = 1)
    if (event.data === YT.PlayerState.PLAYING) {
        const currentPlayerId = event.target.getIframe().id;

        // Loop through all track players to pause others
        Object.keys(players).forEach(function (otherPlayerId) {
            if (otherPlayerId !== currentPlayerId) {
                // Pause other videos so only one plays at a time
                players[otherPlayerId].pauseVideo();
            }
        });
    }
}
