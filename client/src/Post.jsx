import {formatISO9075} from "date-fns";
import {Link} from "react-router-dom";

export default function Post({_id,title,summary,cover,content,createdAt,author}) {
  // Extract just the filename from the full path
  const filename = cover.split(/[\\/]/).pop();
  console.log('Post cover path:', cover);
  console.log('Extracted filename:', filename);
  
  return (
    <div className="post">
      <div className="image">
        <Link to={`/post/${_id}`}>
          <img src={`http://localhost:5000/uploads/${filename}`} alt="" onError={(e) => console.error('Image failed to load:', e.target.src)}/>
        </Link>
      </div>
      <div className="texts">
        <Link to={`/post/${_id}`}>
        <h2>{title}</h2>
        </Link>
        <p className="info">
          <a className="author">{author.username}</a>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}