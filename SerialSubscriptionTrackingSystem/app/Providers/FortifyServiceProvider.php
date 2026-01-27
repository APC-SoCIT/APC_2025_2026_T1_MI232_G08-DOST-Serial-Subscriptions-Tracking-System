use Laravel\Fortify\Contracts\LoginResponse;
use App\Http\Responses\LoginResponse as CustomLoginResponse;

public function register()
{
    $this->app->singleton(LoginResponse::class, CustomLoginResponse::class);
}
