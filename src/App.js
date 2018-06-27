import axios from 'axios';
import moment from 'moment';
import React, { Component } from 'react';
import './App.css';
import articles from './data/articles.json';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            articles,
            moreArticlesEnd: 10,            
            moreArticlesStart: 0,
            start: 0,
            stop: 10, 
            submittedSortOrder: 'asc',
            wordsSortOrder: 'asc',
        };
        this.loadArticles = this.loadArticles.bind(this);
        this.makeXHRRequest = this.makeXHRRequest.bind(this);        
        this.sortBy = this.sortBy.bind(this);
    }
    componentDidMount() {
        // here the engineering parameters state "If a user leaves the page and then returns, their previous sorting choice should be automatically set."
        // So I am saving the articles in the sort order and end point in localStorage and setting their state in componentDidMount
        // so that when a user leaves this app and then returns they see the articles sorted based on their last sorting choice and the number of articles
        // displayed at that time they last sorted. However, the parameters do not clarify if the initial rules of only displaying the first 10 articles
        // should still apply here. If this were an actual project I would discuss this with a UX designer/product owner. But since that is not possible
        // I am assuming the user will want to see all the sorted articles they were viewing on the page before they navigated away. So please note this 
        // is not a bug. :-) 
        if (localStorage.hasOwnProperty('articles')) {
            this.setState({
                articles: JSON.parse(localStorage.articles),
                stop: localStorage.stop 
            });
        }
    }
    makeXHRRequest(appContextThis) {
        axios.get('./more-articles.json')
            .then((response)=> {
                let maxArticlesToDisplay = articles.length + (response.data).length,
                    start = appContextThis.state.moreArticlesStart,
                    end = appContextThis.state.moreArticlesEnd,
                    moreArticles = [...appContextThis.state.articles, ...response.data.slice(start, end)];

                if (localStorage.hasOwnProperty('articles')) { //handle loading articles in the case of using previously stored articles via localStorage
                    moreArticles = this.sortArticles(moreArticles, localStorage.sortDir, localStorage.sortContext);
                }

                appContextThis.setState({ // set state here to update start and end values for articles to display
                    moreArticlesStart: start + 10,
                    moreArticlesEnd: end + 10,
                    articles: moreArticles,
                    stop:  appContextThis.state.stop >= moreArticles.length ? maxArticlesToDisplay : (appContextThis.state.stop + 10)
                });
            })
            .catch((error)=> {
                console.log(error);
            });
    }
    sortArticles(articles, dir, sortContext){
        let sortedArticles = 
            dir === 'asc' ? 
            articles.sort((a, b) => 
                parseFloat(sortContext === 'publish_at' ? Date.parse(a[sortContext]) : a[sortContext])     
                -                                                                                         
                parseFloat(sortContext === 'publish_at' ? Date.parse(b[sortContext]) : b[sortContext]))  
            : 
            articles.sort((a, b) => 
                parseFloat(sortContext === 'publish_at' ? Date.parse(b[sortContext]) : b[sortContext]) 
                - 
                parseFloat(sortContext === 'publish_at' ? Date.parse(a[sortContext]) : a[sortContext]));

        return sortedArticles;
    }
    loadArticles() {
        if (this.state.stop >= articles.length) {
            this.makeXHRRequest(this);
        } else {
            if (localStorage.hasOwnProperty('articles')) { //handle loading articles in the case of using previously stored articles via localStorage
                this.setState({
                    stop: localStorage.stop + 10,
                    articles: this.sortArticles(JSON.parse(localStorage.articles), localStorage.sortDir, localStorage.sortContext)
                });
            } else {
                this.setState({
                    stop: this.state.stop + 10
                });
            }
        }
    }
    sortBy(dir, sortContext) {
        let wordsSortOrder = this.state.wordsSortOrder,
            submittedSortOrder = this.state.submittedSortOrder,
            start = this.state.start,
            end = this.state.stop;

        if (sortContext === 'words') {
            wordsSortOrder = dir === 'asc' ? 'desc' : 'asc';
        }
        if (sortContext === 'publish_at') {
            submittedSortOrder = dir === 'asc' ? 'desc' : 'asc';
        }
        let sortedArticles = 
            dir === 'asc' ? // reverse sort order of currently displayed articles
            this.state.articles.sort((a, b) => 
                parseFloat(sortContext === 'publish_at' ? Date.parse(a[sortContext]) : a[sortContext])     // the UTC string needs to be parsed before it can be sorted on
                -                                                                                         // so check for the field being sorted on (date or word count) first then pass
                parseFloat(sortContext === 'publish_at' ? Date.parse(b[sortContext]) : b[sortContext]))  // either a parsed date obj or word count string to parseFloat()
            : 
            this.state.articles.slice(start, end).sort((a, b) => 
                parseFloat(sortContext === 'publish_at' ? Date.parse(b[sortContext]) : b[sortContext]) 
                - 
                parseFloat(sortContext === 'publish_at' ? Date.parse(a[sortContext]) : a[sortContext]));

        this.setState({
            articles: sortedArticles,
            wordsSortOrder,
            submittedSortOrder
        });

        localStorage.setItem('articles', JSON.stringify(sortedArticles));
        localStorage.setItem('stop', end);
        localStorage.setItem('sortDir', dir);
        localStorage.setItem('sortContext', sortContext);

    }
    render() {
        return (
            <div className="App">
                <Table>
                    <TableHead style={{'backgroundColor': '#F50057'}}>
                        <TableRow>
                            <TableCell>{'Unpublished Articles ' + '(' + this.state.stop + ')'}</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell className='sortable' onClick={()=>this.sortBy(this.state.wordsSortOrder, 'words')}>Words</TableCell>
                            <TableCell className='sortable' onClick={()=>this.sortBy(this.state.submittedSortOrder, 'publish_at')}>Submitted</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.articles.slice(this.state.start, this.state.stop).map((article, idx)=>{
                            return (
                                <TableRow key={idx}>
                                    <TableCell>
                                        <img src={article.image} className='imgIcon' alt={article.title} />
                                        {article.title}
                                    </TableCell>
                                    <TableCell>{article.profile.first_name + ' ' + article.profile.last_name}</TableCell>
                                    <TableCell>{article.words}</TableCell>
                                    <TableCell>{moment(article.publish_at, 'YYYYMMDD').fromNow()}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                 <Button variant="contained" color="secondary" className='tableBtn' onClick={this.loadArticles}>
                    Load More
                </Button>
          </div>
        );
    }
}

export default App;
