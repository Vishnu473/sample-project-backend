//Higher Order Function that will take care of exceptions
//Higher Order funcs - Function inside a function
//The following handles both async and non-async functions
const asyncHandler = (requestHandler) => {
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err) => next(err))
    }
}

export {asyncHandler}