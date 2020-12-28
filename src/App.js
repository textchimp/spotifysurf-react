import React from 'react';
import './App.css';

import SearchResults from './SearchResults';
import ArtistDetails from './ArtistDetails';

// Testing only
import axios from 'axios';
import api from './lib/api';

class App extends React.Component {

  // only need this constructor() function so we can create a
  // ref to the search form
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


  componentDidMount(){

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
    // axios.defaults.headers.common.Authorization = 'Bearer ' + SPOTIFY_TOKEN;

  } //componentDidMount


  handleChange = (ev) => {
    this.setState({ query: ev.target.value });
  }

  setCurrentArtist = (id, name, genres, images) => {
    this.setState({ currentArtist: { id, name, genres, images } });
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

  render(){

  return (
      <div className="App">
        <form onSubmit={this.handleSubmit}>
          <input type="text"
            onChange={this.handleChange} placeholder="artist search"
            ref={ this.searchInput }
            id="searchText"
          />
          <button>Go</button>
        </form>

        <div>{ this.state.errorMsg }</div>

        {
          this.state.currentArtist.id !== undefined
          &&
          <ArtistDetails
           artist={ this.state.currentArtist }
           onError={ this.setErrorMsg }
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

export default App;
