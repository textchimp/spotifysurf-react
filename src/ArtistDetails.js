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
    lastPlaying: null,
    sliders: {
      energy: null,
    },
    loadingMsg: 'Loading artist...'
  };


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
  } // componentDidMount


  componentDidUpdate(prevProps, prevState){
    if( this.props.artist.id !== prevProps.artist.id ){
      // fetch new details (user clicked on another artist in the results)
      d('SECONDARY FETCH', this.props.artist);
      this.fetchDetails();
    }
  } // componentDidUpdate


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
    // Get the audio element; it's the first child of the <li>
    // TODO: is there a neater way to do this? - ideally avoid arrow fns in render JSX
    const audio = ev.currentTarget.firstElementChild;
    const nowPlaying = this.state.nowPlaying;
    // console.log('audio', audio, ev);

    if( nowPlaying.audio ){
      player.fadeOut( nowPlaying.audio );
      if( nowPlaying.track.id === track.id ){
        // if we just clicked the currently-playing track, don't start it again below
        this.setState({ nowPlaying: {} });
        return;
      }
    }

    player.fadeIn( audio );
    this.setState({ nowPlaying: { track, audio, index } });
  } // handleTrackClick


  openArtistInSpotify = () => {
    window.open( this.state.tracks[0].artists[0].external_urls.spotify );
  }

  gotoRecommendedArtist = (ev, rec) => {
    ev.stopPropagation(); // do not treat as track play/pause click
    window.open( rec.external_urls.spotify );
  }

  render(){

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
                  <audio index={ i }>
                    <source type="audio/mpeg" src={ t.preview_url } />
                  </audio>
                  <span className="controls" id={`controls${ i }`}></span>
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
               onClick={ (e) => this.handleTrackClick(e, rec, i) } >
                <audio index={ i }>
                  <source type="audio/mpeg" src={ rec.preview_url } />
                </audio>
                <span className="controls" id={`controls${ i }`}></span>
                &nbsp; { rec.artists[0].name } &nbsp;
                <span className="trackName">– { rec.name }</span>
                <span class="goto" onClick={ (ev) => this.gotoRecommendedArtist(ev, rec) }>view</span>
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
