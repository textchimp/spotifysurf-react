import React from 'react';

// REMOVE except for testing!
import api from './lib/api';

import './SearchResults.css';

class SearchResults extends React.Component {

  state = {
    results: [],
    errorMsg: ''
  };

  componentDidMount(){
    console.log('<SearchResults>', this.props.searchText);

    api.getSearchResults( this.props.searchText, this.props.onError )
    .then( res => this.setState({ results: res.data.artists.items }) )
    // .catch( e => { console.log('CATCH 1 (component)'); }) // THIS NEVER RUNS!

  } // componentDidMount


    componentDidUpdate(prevProps, prevState){
      if( this.props.searchText !== prevProps.searchText ){
        // re-submit search when search text prop changes
        this.setState({ results: [] }); // clear old results
        api.getSearchResults( this.props.searchText, this.props.onError )
        .then( res => this.setState({ results: res.data.artists.items }) )
      }
    } // componentDidUpdate

  render(){

    return (
      <div>
        <h3>Results for <em>{ this.props.searchText }</em></h3>
        <ul id="resultsList">
          { this.state.results.map( a => (
            <li className="result"
             key={a.id}
             style={{ backgroundImage: getImageURL(a) }}
             onClick={ () => this.props.onArtistSelect(a.id, a.name, a.genres, a.images) }>
              <div className="name">
                <strong>{ a.name }</strong>
              </div>
            </li>
          )) }
        </ul>
      </div>
    );
  } // render

} // class SearchResults



const getImageURL = (artist) => {
  if( 'images' in artist  &&  artist.images.length > 0 ){
    return 'url(' + artist.images[0].url + ')';  // length-1 for smallest?
  }
  return '';
};


export default SearchResults;
