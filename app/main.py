import warnings
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

warnings.warn(
    "Products, orders and customer related routes not implemented.",
    category=UserWarning,
    stacklevel=2,
)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(
    title="FaraalKhata",
    version="1.0.0",
    description="FaraalKhata - Order Management System",
    generate_unique_id_function=custom_generate_unique_id,
)

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


@app.get(
    "/",
    response_class=HTMLResponse,
    operation_id="get_dashboard_shell",
    summary="Dashboard / Home",
    description="Returns the main dashboard HTML page.",
    responses={
        200: {
            "description": "HTML Dashboard Page.",
            "content": {"text/html": {"example": "<!DOCTYPE html><html>...</html>"}},
        }
    },
)
async def root(request: Request):
    """
    Serves the HTMX-powered Single Page Application Shell.
    """
    return templates.TemplateResponse("base.html", {"request": request})
