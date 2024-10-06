// Event Listeners
document.getElementById('create-playlist-btn').addEventListener('click', createPlaylist);
document.getElementById('go-to-show-media-btn').addEventListener('click', () => {
    window.location.href = 'show-media.html'; // Navegar para a página de mostrar mídias
});
document.getElementById('go-to-view-playlist-btn').addEventListener('click', () => {
    window.location.href = 'view-playlist.html'; // Navegar para a página de visualização de playlists
});
