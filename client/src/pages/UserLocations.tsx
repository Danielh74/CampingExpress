import { useEffect, useState } from "react"
import { getUserLocations } from "../services/locationService"
import { Link } from "react-router-dom"
import { DateLocation } from "../models/DateLocation"

const UserLocations = () => {
    const [locations, setLocations] = useState<DateLocation[]>([])
    useEffect(() => {
        getUserLocations().then(res => setLocations(res.data.locations))
    }, [])
    return (
        locations?.map(location =>
            <div key={location.id} className="card my-3">
                <div className="row">
                    <div className="col-12 col-md-3">
                        <img className="img-fluid rounded-top rounded w-100 h-100 object-fit-cover" src={location.images[0].url}
                            alt="location image" />
                    </div>
                    <div className="card-body col-md-9">
                        <div className="row">
                            <div className="col-12 mb-0">
                                <span className="row">
                                    <h3 className="col-9">{location.title}</h3>
                                    <span className="col d-flex justify-content-md-end">
                                        <span className="me-1 align-self-center">{`(${location.reviews.length})`}</span>
                                        <p className="d-inline starability-result" data-rating={location.averageRating}>
                                            Rated: {location.averageRating} stars
                                        </p>
                                    </span>
                                </span>
                            </div>
                            <span className="col-12 text-secondary">
                                {location.address}
                            </span>
                            <p className="col-12 card-text mb-0">
                                {location.description}
                            </p>
                            <p className="mt-2">Categories: {<span>{location.categories.join(', ')}</span>}</p>
                            <div className="col d-flex justify-content-start align-items-end">
                                <Link className="btn btn-danger" to={`/location/${location.id}`}>
                                    View {location.title}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    )
}

export default UserLocations