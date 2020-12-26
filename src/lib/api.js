import axios from 'axios';

export const SPOTIFY_TOKEN = "BQBpFndilXEda4OZZz4teiSDnBC8oliDTvqmFWaGfcEOqvpwphS6N1QjYcXcDC1b8hAdgRLPBpWA_l2GUjs";
const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1/';
const SPOTISURF_CLOUD_FUNCTION_TOKEN_URL = 'https://us-central1-functions-test-24b29.cloudfunctions.net/spotisurf?test=1';


const api = {

  getToken(){
    return axios.get(SPOTISURF_CLOUD_FUNCTION_TOKEN_URL)
    .then( res => {
      // this.headers.Authorization = 'Bearer ' + res.data.token;
      console.log('%cset init token %s', 'color: green; font-size: 14px;', res.data.token, );
      axios.defaults.headers.common.Authorization = 'Bearer ' + res.data.token;
      return true;
    });
  }, // getToken


  getSearchResults( text, errorHandler ){
    // 1. IF the query is successful, return the promise, which is handled
    // immediately by the .then() callback in the component (i.e. do a setState)
    return axios.get(SPOTIFY_BASE_URL + 'search', {
      params: {
        q: text,
        type: 'artist'
      },
    })
    // 2. OTHERWISE if the query fails (probably due to token expiry), then
    // return whatever handleRequestError returns, which should be the promise
    // from the axios request in the generateNewTokenAndRetry method it uses
    .catch( e  => {
      console.log('CATCH getSearchResults (API)');
      return this.handleRequestError( e, { request: 'getSearchResults', args: [text], errorHandler });
    }); // catch

  }, // getSearchResults


  getArtistTopTracks( id, errorHandler ){
    return axios.get(SPOTIFY_BASE_URL + `artists/${id}/top-tracks`, {
      params:  { country: 'AU' },
    })
    .catch( e  => {
      console.log('CATCH getArtistTopTracks (API)');
      return this.handleRequestError(e, { request: 'getArtistTopTracks', args: [id], errorHandler }) ;
    });

  }, // getArtistTopTracks


  getArtistRecommendations( id, errorHandler ){
    return axios.get(SPOTIFY_BASE_URL + 'recommendations', {
      params:  { seed_artists: id },
    })
    .catch( e  => {
      console.log('CATCH getArtistRecommendations (API)');
      return this.handleRequestError(e, { request: 'getArtistRecommendations', args: [id], errorHandler }) ;
    });

  }, // getArtistTopTracks


  handleRequestError( err, req ){

    if( err.response.status !== 401 ){
      console.dir( err );
      console.warn('API ERROR', req.request, err.status, err.statusText);
      return; // return/throw error here? probably not, just fail quietly (??)
    }

    console.log('%cGenerating new token...', 'color: orange; font-weight: bold', req);

    req.errorHandler && req.errorHandler('Generating new token...');

    // 3. Try again and return the promise from the axios.get() in generateNewTokenAndRetry
    return api.generateNewTokenAndRetry(req); // see comments in this method below

  }, // handleRequestError


  generateNewTokenAndRetry( lastRequest ){

    // Spotify API tokens expire after an hour, so if a request fails, it's
    // probably because the token has expired.
    // When this happens, we make a request to the Cloud Function endpoint, which
    // makes a request to the Spotify accounts API endpoint using the API secret to
    // create a new access token, which is stored in the database, and sent as the
    // response to this getJSON request. We set the new token into our JS
    // var and re-try the last API request.
    // We need a Cloud Function for regenerating the token, because it involves API
    // secret keys which are not intended to be exposed to the frontend.

    // 4. Get new token and return promise to component making original API request
    return axios.get(SPOTISURF_CLOUD_FUNCTION_TOKEN_URL)
    .then( res => {

      axios.defaults.headers.common.Authorization = 'Bearer ' + res.data.token;

      console.log('%cnew token', 'font-size: 14pt; font-weight: bold;', res.data);
      lastRequest.errorHandler && lastRequest.errorHandler(''); // clear error

      // re-attempt last API call with new token, to avoid user confusion or page reload:
      console.log('Re-try API call:', lastRequest.request, lastRequest);
      return api[ lastRequest.request ]( ...lastRequest.args );

    })
    .catch( err => {
      console.warn('TOKEN REFRESH FAIL', err.response.status, err.response.data);
      console.dir(err);
      // return/throw error?
    });

  }, // generateNewTokenAndRetry


}; // api

export default api;
