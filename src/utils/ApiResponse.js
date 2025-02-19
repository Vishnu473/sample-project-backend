//Custom APIResponse for handling/returning api response in routes
class ApiResponse{
    constructor(statusCode, data, message){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}