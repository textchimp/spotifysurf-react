import React from 'react';
import api from './lib/api';

import './ArtistDetails.css';
// import styles from './ArtistDetails.css';

window.DEBUG = true;

const d = (header, ...args) => {
  'DEBUG' in window && console.log(`%c${header}`, 'font-size: 16px; color: orange;', ...args );
};

class ArtistDetails extends React.Component {

  state = {
    tracks: [],
    recommendations: [],
    nowPlaying: null,
    lastPlaying: null
  };


  fetchDetails(){

    console.log('fetchDetails', this);
    api.getArtistTopTracks( this.props.id, this.props.onError )
    .then( res => this.setState({ tracks: res.data.tracks }) );

    api.getArtistRecommendations( this.props.id, this.props.onError )
    .then( res => this.setState({ recommendations: res.data.tracks }) );

  } // fetchDetails


  componentDidMount(){
    console.log('<ArtistDetails>', this.props.id);
    this.fetchDetails();
  } // componentDidMount


  componentDidUpdate(prevProps, prevState){
    if( this.props.id !== prevProps.id ){
      // fetch new details (user clicked on another artist in the results)
      d('SECONDARY FETCH', this.props);
      this.fetchDetails();
    }
  } // componentDidUpdate


  render(){

    return (
      <div>
        <h2>{ this.props.name }</h2>

        <ul className="tracks">
          <h3>Top Tracks</h3>
          {
            this.state.tracks.map( t => (
              <li key={ t.id } className="clickable"
                onClick={ ev => ev.target.nextSibling.play() }
              >
                <span>{ t.name }</span>
                <audio>
                  <source type="audio/mpeg" src={ t.preview_url } />
                </audio>
              </li>
            ))
          }
        </ul>

        <ul className="recs">
          <h3>Recommendations</h3>
          {
            this.state.recommendations.map( rec => (
              <li key={ rec.id } className="clickable">
                <span>{ rec.artists[0].name }</span>
                <audio controls>
                  <source type="audio/mpeg" src={ rec.preview_url } />
                </audio>
              </li>
            ))
          }
        </ul>

      </div>
    );
  } // render

} // class ArtistDetails

export default ArtistDetails;
