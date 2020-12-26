import React from 'react';

import api from './lib/api';

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

  render(){

    return (
      <div>
        <h3>Results for <em>{ this.props.searchText }</em></h3>
        <ul>
          { this.state.results.map( a => (
            <li key={a.id} onClick={ () => this.props.onArtistSelect(a.id, a.name) }>
              { a.name }
            </li>
          )) }
        </ul>
      </div>
    );
  } // render

} // class SearchResults

export default SearchResults;
