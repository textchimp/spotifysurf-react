import React from 'react';
import './App.css';

import SearchResults from './SearchResults';
import ArtistDetails from './ArtistDetails';

// Testing only
import axios from 'axios';

import api from './lib/api';

class App extends React.Component {

  // Only need this constructor() function so we can create a
  // ref to the search form using 'createRef'
  constructor(props){
    super(props);

    this.state = {
      query: 'metz',
      search: '',
      currentArtist: {},
      errorMsg: '',
      breadcrumbTrail: []
    };

    this.searchInput = React.createRef(); // control focus/blur of form input

  } // constructor


  componenttDidMount(){

    this.searchInput.current.focus();

    // Testing only
    const params = new URLSearchParams(window.location.search);

    const testSearch = params.get('test');
    if( testSearch ) {
      this.setState({ search: testSearch });
    }

    const token = params.get('token');
    if( token ){
      axios.defaults.headers.common.Authorization = 'Bearer ' + token;
      return;
    }

    api.getToken()
    .catch( err => {
      console.warn('api.getToken(): FAILED to get initial token', err);
      this.setState({ errorMsg: 'Error loading API token. Sorry!' });
    });

  } //componentDidMount


  handleChange = (ev) => {
    this.setState({ query: ev.target.value });
  }


  setCurrentArtist = (id, name, genres, images) => {
    this.setState({
      currentArtist: { id, name, genres, images },
      breadcrumbTrail: [ ...this.state.breadcrumbTrail, { id, name } ]
    });
  }

  // A method to pass to API call methods (via child component props)
  // so they can set and clear the 'generating new token' message
  setErrorMsg = (msg) => {
    this.setState({ errorMsg: msg });
  }


  handleSubmit = (ev) => {
    ev.preventDefault();
    // copy query text to 'search', which triggers <SearchResults>
    this.setState({ search: this.state.query });
    this.searchInput.current.blur(); // blur form so keypresses work to control audio
  }


  loadArtist = (id) => {

    // Because this artist has been selected from a recommendation (or from a
    // breadcrumb trail click), we don't have the artist image & genres as we do
    // from a search result; so first we have to get the artist details, and then
     // we can load the Top Tracks and Recommendations, as usual
    api.getArtistInfo( id, this.setErrorMsg )
    .then( ({data: a}) => this.setCurrentArtist(a.id, a.name, a.genres, a.images) );

  } // loadArtist


  render(){

    return (
      <div className="App">

        <form onSubmit={this.handleSubmit}>
          <input type="text"
           id="searchText"
           placeholder="artist search"
           onChange={this.handleChange}
           ref={ this.searchInput }
          />
          <button>Go</button>
        </form>

        <div id="status">{ this.state.errorMsg }</div>

        <BreadcrumbTrail trail={ this.state.breadcrumbTrail } onClick={ this.loadArtist } />

        {
          this.state.currentArtist.id !== undefined
          &&
          <ArtistDetails
           artist={ this.state.currentArtist }
           onError={ this.setErrorMsg }
           onViewArtist={ this.loadArtist }
          />
        }

        {
          this.state.search.length > 0
          &&
          <SearchResults
           searchText={ this.state.search }
           onArtistSelect={ this.setCurrentArtist }
           onError={ this.setErrorMsg }
          />
        }

      </div>
    );
  } // render

} // class App


const BreadcrumbTrail = ({trail, onClick}) => {

  if( trail.length < 2 ){
    return null;
  }

  return (
    <div id="trail">
    <strong>Trail</strong>: &nbsp;
    <ul className="trail">
    {
      trail.map( (artist, i) => {
        // Don't show last (current) item
        return i === trail.length-1 ? null : (
          <li key={ artist.id }>
            <a onClick={ () => onClick(artist.id) } href="#">{ artist.name }</a>
            { i < trail.length-2 && <span>&gt;</span> }
          </li>
        );
      })
    }
    </ul>
    </div>
  );
}; // BreadcrumbTrail

export default App;
