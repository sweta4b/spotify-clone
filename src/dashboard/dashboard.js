import { info } from "autoprefixer";
import { doc } from "prettier";
import { fetchRequest } from "../api";
import { ENDPOINT, logOut, SECTIONTYPE } from "../common";


const audio = new Audio();
const controller = new AbortController();
const signal = controller.signal;
const volume = document.querySelector("#volume");
const playButton = document.querySelector("#play");
const totalSongDuration = document.querySelector("#total-song-duration");
const songDurationCompleted = document.querySelector("#song-duration-completed"); 
const songProgress = document.querySelector("#progress");
let progressInterval;
const timeline = document.querySelector("#timeline");

const onProfileClick = (event) => {
  event.stopPropagation();
  const profileMenu = document.querySelector("#profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("li#logout").addEventListener("click", logOut);
  }
};

const loadUserProfile = async () => {
  const defaultImage = document.querySelector("#default-image");
  const profileButton = document.querySelector("#user-profile-btn");
  const displayNameElement = document.querySelector("#display-name");

  const { display_name: displayName, images } = await fetchRequest(
    ENDPOINT.userInfo
  );

  if (images?.length) {
    defaultImage.classList.add("hidden");
  } else {
    defaultImage.classList.remove("hidden");
  }

  displayNameElement.textContent = displayName;

  profileButton.addEventListener("click", onProfileClick);
};

const onPlaylistItemClicked = (event, id) => {
  console.log(event.target);
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `playlist/${id}`);
  loadSection(section);
};

const loadPlaylist = async (endpoint, elementId) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);
  const playlistItemSection = document.querySelector(`#${elementId}`);

  for (let { name, description, images, id } of items) {
    const playlistItem = document.createElement("section");
    playlistItem.className =
      "bg-black-secondary rounded p-4 cursor-pointer hover:bg-lightblack ";
    playlistItem.id = id;
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.addEventListener("click", (event) =>
      onPlaylistItemClicked(event, id)
    );

    const [{ url: imageUrl }] = images;
    playlistItem.innerHTML = `<img src="${imageUrl}" alt="${name}" class="rounded mb-2 object-cover shadow" />
        <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
        <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>
      </section>`;

    playlistItemSection.appendChild(playlistItem);
  }
};

const loadPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlaylist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
};

const fillContentForDashboard = () => {
  const pageContent = document.querySelector("#page-content");
  const playlistmap = new Map([
    ["featured", "featured-playlist-items"],
    ["top playlist", "top-playlist-items"],
  ]);
  let innerHTML = "";
  for (let [type, id] of playlistmap) {
    innerHTML += `<article class="p-4">
        <h1 class="text-2xl mb-4 font-bold capitalize">${type}</h1>
        <section class="featured-songs grid grid-cols-auto-fill-cards gap-4" id="${id}">
        </section>
      </article>`;
  }
  pageContent.innerHTML = innerHTML;
};

const formatTime = (duration) => {
  const min = Math.floor(duration / 60_000);
  const sec = ((duration % 6_000) / 1000).toFixed(0);
  const formattedTime =
    sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
  return formattedTime;
};

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if (trackItem.id === id){
            trackItem.classList.add("bg-gray", "selected");
        }else{
            trackItem.classList.remove("bg-gray", "selected");
        }
    })
}


const updateIconsForPlayMode = (id) => {
    playButton.querySelector("span").textContent = "pause_circle";
    const playButtonFromTracks = document.querySelector(`#play-track${id}`);
    playButtonFromTracks.textContent = "||";
    playButtonFromTracks.setAttribute("data-play", "");
}

const updateIconsForPauseMode = (id) => {
    playButton.querySelector("span").textContent = "play_circle";
        const playButtonFromTracks = document.querySelector(`#play-track${id}`);
        playButtonFromTracks.textContent = "►";
}


const onAudioMetadataLoaded = (id) => {
    totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
    updateIconsForPlayMode(id);
}

const onNowPlayingPlayButtonClicked = (id) => {
    if(audio.paused) {
        audio.play();
        updateIconsForPlayMode(id);
    } else {
        audio.pause();
        updateIconsForPauseMode(id);
    }
}

const onPlayTrack = (event, {image, artistNames, name, duration_ms, previewUrl, id}) => {
    //   console.log(image, artistNames, name, duration_ms, previewUrl, id);
     const buttonWithDataPlay = document.querySelector(`[data-play="true"]`);
     if(buttonWithDataPlay?.id === `play-track${id}`){
        if(audio.paused){
            audio.play();
            updateIconsForPlayMode(id);
        }else{
            audio.pause();
            updateIconsForPauseMode(id);
        }
       
     }else{
        document.querySelectorAll("[data-play]").forEach(btn => btn.setAttribute("data-play","false"));
        const nowPlayingSongImage = document.querySelector("#now-playing-image");
        nowPlayingSongImage.src = image.url;
  
        const songTitle = document.querySelector("#now-playing-song");
        songTitle.textContent = name;
  
        const artists = document.querySelector("#now-playing-artists");
        artists.textContent = artistNames;
  
        audio.src = previewUrl;
        controller.abort();
        audio.addEventListener("loadedmetadata", () => onAudioMetadataLoaded(id), { signal: controller.signal });
        playButton.addEventListener("click", () => onNowPlayingPlayButtonClicked(id));
        audio.play();
  
        clearInterval(progressInterval);
        progressInterval =  setInterval(() => {
          if(audio.paused){
              return
          }else{
              songDurationCompleted.textContent = `${audio.currentTime.toFixed(0) < 10 ? "0:0" + audio.currentTime.toFixed(0) :"0:" + audio.currentTime.toFixed(0) }`;
              songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
          }
        }, 100);
     }

      

}

const loadPlaylistTracks = ({ tracks }) => {
  const trackSections = document.querySelector("#tracks");
  let trackNo = 1;
  for (let trackItem of tracks.items) {
    let { id, artists, name, album, duration_ms, preview_url: previewUrl } = trackItem.track;
    let track = document.createElement("section");
    track.id = id;
    track.className =
      "track p-1 items-center justify-items-start grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary rounded-md hover:bg-lightblack cursor-pointer";
    let image = album.images.find((img) => img.height === 64);
    let artistNames = Array.from(artists,(artist) => artist.name).join(", ");
    track.innerHTML = `
        <p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNo++}</span></p>
        <section class="grid grid-cols-[auto_1fr] place-items-center gap-2 justify-center">
          <img class="h-10 w-10" src="${image.url}" alt="${name}">
          <article class="flex flex-col gap-2 justify-self-center">
            <h2 class="text-white text-base line-clamp-1">${name}</h2>
            <p class="text-xs line-clamp-1">${artistNames}</p>
          </article>
        </section>
        <p class="text-sm">${album.name}</p> 
        <p class="text-sm">${formatTime(duration_ms)}</p>`;

    track.addEventListener("click", (event) => onTrackSelection(id, event));
    const playButton = document.createElement("button");
    playButton.id =`play-track${id}`;
    playButton.className = "play w-full absolute left-0 text-lg invisible";
    playButton.textContent = "►";
    playButton.addEventListener("click", (event) => onPlayTrack(event, { image, artistNames, name, duration_ms, previewUrl, id }));
    track.querySelector("p").appendChild(playButton);
    trackSections.appendChild(track);
  }
};

const fillContentForPlaylist = async (playlistId) => {
  const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
  
  const coverElement = document.querySelector("#cover-content");
  const {name, description, images, tracks} = playlist;

  coverElement.innerHTML = `
                <img class="object-contain h-36 w-36" src="${images[0].url}" alt="">
                <section>
                <h2 class="text-4xl" id="playlist-name">${name}</h2>
                <p id="playlist-details">${tracks.items.length} songs</p>
                </section>
              `
  const pageContent = document.querySelector("#page-content");
  pageContent.innerHTML = `
    <header id="playlist-header" class="mx-8 py-4 border-secondary border-b-[0.5px] z-10">
    <nav class="py-2">
    <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary">
      <li class="justify-self-center">#</li>
      <li>Title</li>
      <li>Album</li>
      <li>Time</li>
    </ul>
    </nav>
  </header>
  <section id="tracks" class="px-8 mt-4">
  </section`;

  loadPlaylistTracks(playlist);
};

const onContentScroll = (event) => {
  const { scrollTop } = event.target;
  const header = document.querySelector(".header");
  if (scrollTop >= header.offsetHeight) {
    header.classList.add("sticky", "top-0", "bg-black");
    header.classList.remove("bg-transparent");
  } else {
    header.classList.remove("sticky", "top-0", "bg-black");
    header.classList.add("bg-transparent");
  }
  if (history.state.type === SECTIONTYPE.PLAYLIST) {
    const coverElement = document.querySelector("#cover-content");
    const playlistHeader = document.querySelector("#playlist-header");
    if (scrollTop >= coverElement.offsetHeight - header.offsetHeight) {
      playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = "revert";
    }
  }
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    fillContentForDashboard();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    fillContentForPlaylist(section.playlist);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
  const section = { type: SECTIONTYPE.DASHBOARD };
  history.pushState(section, "", "");
  loadSection(section);
  //    fillContentForDashboard();
  //    loadPlaylists();
  document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });

  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  })

  timeline.addEventListener("click", (e) => {
    const timelineWidth = window.getComputedStyle(timeline).width;
    const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
    audio.currentTime = timeToSeek;
    songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  },false);


  document
    .querySelector(".content")
    .addEventListener("scroll", onContentScroll);



  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});
