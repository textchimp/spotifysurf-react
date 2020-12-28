import React from 'react';
import api from './lib/api';

import './ArtistDetails.css';

window.DEBUG = true;

// trying out a custom debug function with built-in highlighting/CSS
const d = (header, ...args) => {
  'DEBUG' in window && console.log(`%c${header}`, 'font-size: 16px; color: orange;', ...args );
};

class ArtistDetails extends React.Component {

  state = {
    tracks: [],
    recommendations: [],
    nowPlaying: {},
    lastPlaying: {},
    sliders: {
      energy: null,
    },
    loadingMsg: 'Loading artist...'
  };

  audioPlayers = [];

  fetchDetails(){

    console.log('fetchDetails', this);
    api.getArtistTopTracks( this.props.artist.id, this.props.onError )
    .then( res => this.setState({ tracks: res.data.tracks, loadingMsg: '' }) );

    api.getArtistRecommendations( this.props.artist.id, this.state.sliders.energy, this.props.onError )
    .then( res => this.setState({ recommendations: res.data.tracks }) );

  } // fetchDetails


  componentDidMount(){

    console.log('<ArtistDetails>', this.props.artist.id);
    this.fetchDetails();

    // listen for keypresses to control audio playback
    window.addEventListener('keydown', this.handleKeyDown);

  } // componentDidMount


  componentDidUpdate(prevProps, prevState){
    if( this.props.artist.id !== prevProps.artist.id ){
      // fetch new details (user clicked on another artist in the results)
      d('Update fetchDetails()', this.props.artist);
      this.fetchDetails();
    }
  } // componentDidUpdate


  componentWillUnmount() {
    // clean up
    window.removeEventListener('keydown', this.handleKeyDown);
  }


  handleKeyDown = (ev) => {
    if( ev.target.id === 'searchText' ){
      return; // ignore typing into search form
    }
    console.log('handleKeyDown()', ev);

    let preventDefault = true;
    const {nowPlaying, lastPlaying} = this.state;


    // TODO: moving left/right between tracks too quickly occasionally
    // prevents the last track from pausing before the next one starts...
    // need a throttle timeout to prevent moving too quickly

    switch( ev.key ){

    case ' ':
      // Spacebar toggles current audio playback, or starts current artist track

      if(nowPlaying.audio === undefined ){

        if(lastPlaying.audio === undefined ){
          // start playing the first of the artist tracks (using the array of
          // audio tag refs)
          player.fadeIn( this.audioPlayers[0] );
          this.setState({
            nowPlaying: {
              track: this.state.tracks[0],
              audio: this.audioPlayers[0],
              index: 0 }
          });
        } else {
          // play last playing track
          player.fadeIn(lastPlaying.audio);
          this.setState({ nowPlaying: {...lastPlaying} });
        }

      } else {
        // nowPlaying is set, i.e. audio is playing - pause current track
        player.fadeOut(nowPlaying.audio);
        this.setState({ lastPlaying: {...nowPlaying}, nowPlaying: {} });
      }
      break;

    case 'Enter':
      // Enter opens the currently playing track as a new Spotify tab

      if( this.state.nowPlaying.audio === undefined ){
        return; // ignore when nothing is playing
      }

      if( nowPlaying.index >= 10 ){
        // recommended track
        window.open( nowPlaying.track.artists[0].external_urls.spotify );
      } else {
        // current artist track
        window.open( nowPlaying.track.external_urls.spotify );
        player.fadeOut( nowPlaying.audio ); // stop playing because Spotify track page autoplays 🙄
      }
      break;

    case 'ArrowLeft':
      // Play previous track
      const { prevAudio, prevIndex } = player.playPreviousTrack( nowPlaying, this.audioPlayers );
      if( prevIndex === null ){
        return; // none found
      }

      this.setState({
        nowPlaying: {
          // indexes 0-9 are artist tracks, 10-29 are recommendations
          track: prevIndex < 10 ? this.state.tracks[prevIndex] : this.state.recommendations[prevIndex-10],
          audio: prevAudio,
          index: prevIndex
        }
      });

      break;

    case 'ArrowRight':
      // Play next track
      const { nextAudio, nextIndex } = player.playNextTrack( nowPlaying, this.audioPlayers );
      if( nextIndex === null ){
        return; // none found
      }

      this.setState({
        nowPlaying: {
          // indexes 0-9 are artist tracks, 10-29 are recommendations
          track: nextIndex < 10 ? this.state.tracks[nextIndex] : this.state.recommendations[nextIndex-10],
          audio: nextAudio,
          index: nextIndex
        }
      });

      break;

    default:
      preventDefault = false; // stop preventDefault() from running, below
    } // switch

    // If we don't preventDefault() for unused keys,
    // shorts for reload, open dev tools etc stop working!
    preventDefault && ev.preventDefault();

  } // handleKeyDown


  updateSlider = (ev) => {
    const { name, value } = ev.target;
    console.log('slider update', { name, value});
    this.setState({
      sliders: {
        ...this.state.sliders, // existing state for other sliders
        [name]: parseFloat(value)
      }
    });

    api.getArtistRecommendations( this.props.artist.id, value, this.props.onError )
    .then( res => this.setState({ recommendations: res.data.tracks }) );


  } // updateSlider


  handleTrackClick = (ev, track, index) => {

    if( !this.audioPlayers[index] ){
      return; // ignore click on items without audio previews (need 'goto' link to work)
    }

    // Get the audio element; it's the first child of the <li>
    // TODO: is there a neater way to do this? - ideally avoid arrow fns in render JSX
    const audio = ev.currentTarget.firstElementChild;
    const nowPlaying = this.state.nowPlaying;
    // console.log('audio', audio, ev);

    if( nowPlaying.audio ){
      player.fadeOut( nowPlaying.audio );
      if( nowPlaying.track.id === track.id ){
        // if we just clicked the currently-playing track, don't start it again below

        this.setState({ lastPlaying: {...this.state.nowPlaying}, nowPlaying: {} });
        return;
      }
    }

    player.fadeIn( audio );
    this.setState({ nowPlaying: { track, audio, index } });
  } // handleTrackClick


  openArtistInSpotify = () => {
    window.open( this.state.tracks[0].artists[0].external_urls.spotify );
  }


  openRecommendedArtistInSpotify = () => {
    // this should be for Enter key: window.open( rec.external_urls.spotify );
  }


  viewRecommendedArtist = (ev, rec) => {
    ev.stopPropagation(); // do not treat as track play/pause click
    console.log('view', rec.artists[0].id);

    this.props.onViewArtist( rec.artists[0].id );

  } // viewRecommendedArtist


  render(){

    // console.log('BEFORE audioPlayers', this.audioPlayers);
    //
    //
    // this.audioPlayers = []; // empty before rendering, since we rely on skipping missing audio
    // window.a = this.audioPlayers;
    //
    // console.log('audioPlayers', this.audioPlayers);

    return (
      <div id="details" style={{ backgroundImage: getImageURL(this.props.artist.images) }}>
        { /* <h2 className="loading">Loading artist...</h2> */ }
        <div className="heading">
          <h2>
            <a id="artistName" target="_blank" href="#" onClick={ this.openArtistInSpotify } title={`View ${this.props.artist.name} on Spotify`}>
              { this.props.artist.name }
            </a>
          </h2>
          <span className="genres">{ this.props.artist.genres && this.props.artist.genres.slice(0, 6).join(', ') }</span>
        </div>
        <div className="grid">
          <div className="topTracks">
            <h4>Top Tracks</h4>
            <ul>
              {
              this.state.tracks.map( (t, i) => (
                <li key={ t.id }
                 className={`
                   player
                   ${t.preview_url ? 'hasPreview' : 'noPreview'}
                   ${this.state.nowPlaying.track && this.state.nowPlaying.track.id === t.id ? 'playing' : '' }
                  `}
                 onClick={ (e) => this.handleTrackClick(e, t, i) } >
                  { t.preview_url ?
                    <audio ref={ (ref) => this.audioPlayers[i] = ref }>
                      <source type="audio/mpeg" src={ t.preview_url } />
                    </audio>
                    : ''
                  }
                  <span className="controls" />
                  <em>{ t.name }</em>
                </li>
              ))
              }
            </ul>
          </div>{ /* div.topTracks */ }
          <div className="recs">
            <h4>Recommendations</h4>
            {
              /*
              energy: <input type="range" name="energy" min="0.0" max="1.0" step="0.01" onMouseUp={ this.updateSlider } />
              <br/>
              */
            }
            <ul>
            {
            this.state.recommendations.map( (rec, i) => (
              <li key={ rec.id }
               className={`
                 rec player
                 ${rec.preview_url ? 'hasPreview' : 'noPreview'}
                 ${this.state.nowPlaying.track && this.state.nowPlaying.track.id === rec.id ? 'playing' : '' }
                `}
               onClick={ (e) => this.handleTrackClick(e, rec, i + 10) } >
               { rec.preview_url ?
                  <audio ref={ (ref) => this.audioPlayers[i+10] = ref }>
                    <source type="audio/mpeg" src={ rec.preview_url } />
                  </audio>
                  : ''
               }
                <span className="controls" />
                &nbsp; { rec.artists[0].name } &nbsp;
                <span className="trackName">– { rec.name }</span>
                <span className="goto" onClick={ (ev) => this.viewRecommendedArtist(ev, rec) }>view</span>
              </li>
            ))
            }
            </ul>
          </div>{ /* div.recs */ }
        </div>{ /* div.grid */ }
      </div>
    );
  } // render

} // class ArtistDetails


const player = {

  playPreviousTrack( nowPlaying, audioPlayers ){

    if( nowPlaying.track === undefined ){
      return {prevAudio: null, prevIndex: null};
    }

    let prevIndex = nowPlaying.index - 1;
    let prevAudio = audioPlayers[ prevIndex ];

    while( prevIndex >= 0 && !prevAudio ){
      prevIndex--;
      prevAudio = audioPlayers[ prevIndex ];
    }

    if( !prevAudio ){
      return {prevAudio: null, prevIndex: null}; // start of list
    }

    // stop current, start next
    this.fadeOut( nowPlaying.audio );
    this.fadeIn( prevAudio );

    return { prevAudio, prevIndex };
  }, // playPreviousTrack


  playNextTrack( nowPlaying, audioPlayers ){

    if( nowPlaying.track === undefined ){
      return {prevAudio: null, prevIndex: null};
    }

    let nextIndex = nowPlaying.index + 1;
    let nextAudio = audioPlayers[ nextIndex ];

    while( nextIndex < audioPlayers.length && !nextAudio ){
      nextIndex++;
      nextAudio = audioPlayers[ nextIndex ];
    }

    if( !nextAudio ){
      return {nextAudio: null, nextIndex: null}; // start of list
    }

    // stop current, start next
    this.fadeOut( nowPlaying.audio );
    this.fadeIn( nextAudio );

    return { nextAudio, nextIndex };
  }, // playNextTrack


  fadeOut( audio ){
    // Pasted from https://stackoverflow.com/a/36900986
    if(audio.volume){
      let vol = audio.volume;
      const speed = 0.08;  // Rate of decrease
      const fAudio = setInterval(function(){
        vol -= speed;
        audio.volume = vol.toFixed(1);
        if( vol.toFixed(1) <= 0 ){
           clearInterval(fAudio);
           audio.pause();
           audio.volume = 1.0; // just in case?
        }
      }, 50);
    }
  }, //audioFadeOut


  fadeIn( audio ){
    // Pasted from https://stackoverflow.com/a/36900986
    audio.play();
    let vol = 0;
    audio.volume = vol;
    const speed = 0.08;  // Rate of increase
    const fAudio = setInterval(function(){
      vol += speed;
      audio.volume = vol.toFixed(1);
      if( vol.toFixed(1) >= 1.0 ){
         clearInterval(fAudio);
      }
    }, 50);
  }, //audioFadeOut

}; // player object


const getImageURL = (images) => {
  if( images && images.length > 0 ){
    return 'url(' + images[0].url + ')';  // length-1 for smallest?
  }
  return '';
};


export default ArtistDetails;
