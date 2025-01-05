import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom"
import { campgroundsService } from "../services/campgroundService";
import { Campground } from "../models/Campground";
import { useForm } from 'react-hook-form'

type CampForm = {
    title: string,
    location: string,
    price: number,
    description: string,
    images: File[],
    deleteImages?: string[]
}

const CampgroundForm = () => {
    const { id } = useParams();
    const location = useLocation();
    const [campground, setCampground] = useState<Campground>(location.state.campground);
    const { register, handleSubmit } = useForm({
        defaultValues: {
            title: campground.title,
            location: campground.location,
            price: campground.price,
            description: campground.description,
            images: campground.images,
            deleteImages: []
        }
    });

    useEffect(() => {
        if (campground === null && id !== undefined) {
            campgroundsService.getCampground(id)
                .then(res => {
                    setCampground(res.data.campground);
                })
        }
    }, [campground, id]);

    const onSubmit = (data: CampForm) => {
        console.log(data);

    }

    return (
        <div className="row">
            <h1 className="text-center">Edit Campground</h1>
            <div className="col-md-6 offset-md-3">
                <form onSubmit={handleSubmit(onSubmit)} className="needs-validation" encType="multipart/form-data">
                    <div className="mb-2">
                        <label className="form-label" htmlFor="title">Title</label>
                        <input className="form-control" type="text" {...register("title", { required: true })} id="title" />
                        <div className="invalid-feedback">
                            Title is required.
                        </div>
                    </div>
                    <div className="mb-2">
                        <label className="form-label" htmlFor="location">Location</label>
                        <input className="form-control" type="text" {...register("location", { required: true })} id="location" />
                        <div className="invalid-feedback">
                            Location is required.
                        </div>
                    </div>
                    <div className=" mb-2">
                        <label htmlFor="price">Price</label>
                        <div className="input-group">
                            <span className="input-group-text">$</span>
                            <input type="number" className="form-control" placeholder="0.00" id="price" {...register("price", { required: true, min: 0.01 })} />
                            <div className="invalid-feedback">
                                Price is required.
                            </div>
                        </div>
                    </div>
                    <div className="mb-2">
                        <label className="form-label" htmlFor="description">Description</label>
                        <textarea className="form-control" id="description"
                            {...register('description', { required: true })}></textarea>
                        <div className="invalid-feedback">
                            Description is required.
                        </div>
                    </div>
                    <div className="mb-2">
                        <label className="form-label" htmlFor="image">Add images</label>
                        <input className="form-control" type="file" {...register('images')} multiple id="image" />
                    </div>
                    <div>
                        {campground.images.map((img, i) =>
                            <span key={img._id}>
                                <img src={img.url} alt="" />
                                <input type="checkbox" {...register(`deleteImages`)} value={img.name} id={`img-${i}`}></input>
                                <label htmlFor={`img-${i}`}>Delete?</label>
                            </span>
                        )}
                    </div>
                    <div className="my-2">
                        <button className="btn btn-success">Apply Changes</button>
                    </div>
                </form>
                <a href={`/campground/${campground.id}`}>Back To Campground</a>
            </div>
        </div>
    )
}

export default CampgroundForm