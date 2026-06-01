from bs4 import BeautifulSoup, Tag
from bs4.formatter import HTMLFormatter
from typing import Tuple, TypeAlias, Optional
from argparse import ArgumentParser
from git import Repo, InvalidGitRepositoryError
from pathlib import Path
from enum import IntEnum, StrEnum

INDENT_LEVEL=4

File: TypeAlias = Tuple[str, str]

_cdn_links = []

_input_path: str = ""

class ColorCode(StrEnum):
    RST = "\x1b[0m"
    RED = "\x1b[31m"
    GREEN = "\x1b[32m"
    YELLOW = "\x1b[33m"
    BLUE = "\x1b[34m"
    PURPLE = "\x1b[35m"
    CYAN = "\x1b[36m"
    WHITE = "\x1b[37m"
    GRAY = "\x1b[90m"
def color(text: str, color: str) -> str:
    return f"{color}{text}{ColorCode.RST}"

class LogLevel(IntEnum):
    Info = 0
    Warn = 1
    Error = 2
def log(lvl: int, msg: str) -> None:
    match lvl:
        case LogLevel.Warn:
            prefix = color("WARN", ColorCode.YELLOW)
        case LogLevel.Error:
            prefix = color("ERROR", ColorCode.RED)
        case _:
            prefix = color("INFO", ColorCode.CYAN)
        
    print(f"[{prefix}] {msg}")

def get_short_url():
    try:
        repo = Repo(".")
        
        # No one uses anything other than origin, this is fine
        url = repo.remotes.origin.url
        
        # Could probably use a regex here but I'd honestly rather die
        short_url = url.split("github.com/")[-1].split("github.com:")[-1].replace(".git", "")
        return short_url
    except Exception as e:
        log(LogLevel.Warn, f"Found git repo, but failed to get origin URL: {e}")

def in_repo() -> bool:
    try:
        # I really hate this pattern of try..except for simple conditions
        _ = Repo(".", search_parent_directories=True)
        return True
    except InvalidGitRepositoryError:
        return False

def is_uri(s: str) -> bool:
    return (s is not None) and (s.startswith("http") or s.startswith("//"))

def jsdelivr_url(gh: str, file: str, branch: str = "main") -> str:
    return f"https://cdn.jsdelivr.net/gh/{gh}@{branch}/{file}"

def resolve_repo_fp(rp: str) -> str:
    path = Path(rp)
    if path.is_absolute():
        try:
            return path.relative_to(Path.cwd()).as_posix()
        except ValueError:
            return path.as_posix()
    return path.as_posix()

def resolve_filepath(rp: str) -> str:
    base_dir = Path(_input_path).parent.resolve()
    full = (base_dir / rp).resolve()
    try:
        return full.relative_to(Path.cwd()).as_posix()
    except ValueError:
        return full.as_posix()

def read_file(fp: str) -> str:
    try:
        with open(fp, "r") as f:
            return f.read()
    except FileNotFoundError:
        log(LogLevel.Error, f"Input file not found {color(fp, ColorCode.GRAY)}")
        return ""

def build_loader(sf_out: str, github_url: Optional[str], out: str) -> None:
    if sf_out is None or github_url is None:
        return
    
    out_rel = Path(out).resolve()
    out_rel = resolve_repo_fp(str(out_rel))
    log(LogLevel.Info, f"Generating single-file loader {color(out_rel, ColorCode.GRAY)}")
        
    tpl_path = Path(__file__).parent.joinpath("loader.template.html")
    try:
        tpl = tpl_path.read_text()
    except FileNotFoundError:
        log(LogLevel.Warn, f"Loader template {color(str(tpl_path), ColorCode.GRAY)} not found, loader will not be generated")
        return
    
    # Replace placeholder tokens in template
    tpl = tpl.replace("{{CDN_URL}}", "https://cdn.jsdelivr.net/gh")
    tpl = tpl.replace("{{GITHUB_URL}}", github_url)
    tpl = tpl.replace("{{GITHUB_BRANCH}}", "main")  # Might try to parse later, for now main is fine
    tpl = tpl.replace("{{OUTPUT_FILE}}", out_rel)
    
    Path(sf_out).write_text(tpl)

def write_output(out: str, ld_out: str, sf_out: str, github_url: Optional[str], no_purge: bool, soup: BeautifulSoup) -> None:
    script_path = Path(__file__).parent.resolve()
    purge_file = Path(".jsdelivr.purge")
    
    out_path = Path(out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out = out_path.as_posix()
    log(LogLevel.Info, f"Writing output {color(out, ColorCode.GRAY)}")
    try:
        with open(out, "w") as f:
            fmt = HTMLFormatter(indent=INDENT_LEVEL)
            output = soup.prettify(formatter=fmt)
            f.write(output) # type: ignore
    except Exception as e:
        log(LogLevel.Error, f"Failed to write output {color(out, ColorCode.GRAY)}: {e}")
        return
    
    # Write JsDelivr links for JsDelivr cache purge
    if no_purge == False:
        jsd_purge = script_path.joinpath(purge_file)
        jsd_rel = jsd_purge.relative_to(Path.cwd()).as_posix()

        log(LogLevel.Info, f"Writing purge URLs {color(jsd_rel, ColorCode.GRAY)}")
        try:
            with open(jsd_purge, "w") as r:
                r.write('\n'.join(_cdn_links))
                if github_url:
                    r.write(f'\n{jsdelivr_url(github_url, out)}')
        except Exception as e:
            log(LogLevel.Error, f"Failed to write purge URLs {color(str(jsd_rel), ColorCode.GRAY)}: {e}")

    build_loader(sf_out, github_url, ld_out)

def append_head(soup: BeautifulSoup, tag: Tag) -> None:
    head = soup.find("head")
    if head is not None and isinstance(head, Tag):
        head.append(tag)

def parse_links(soup: BeautifulSoup) -> list[File]:
    css_files: list[str] = []

    # Get all referenced stylesheets
    for link in soup.find_all("link", rel="stylesheet"):
        if isinstance(link, Tag):
            href = str(link.get('href'))
            if href:
                # Do not try to embed remote stylesheets
                if not is_uri(href):
                    css_files.append(resolve_filepath(href))
                    link.decompose()
    
    styles = []

    for file in css_files:
        try:
            contents = read_file(file)
            styles.append((file, contents))
        except FileNotFoundError:
            log(LogLevel.Warn, f"Missing stylesheet {color(file, ColorCode.GRAY)}")
        except IsADirectoryError:
            log(LogLevel.Warn, f"Expected stylesheet, got directory {color(file, ColorCode.GRAY)}")
        except Exception as e:
            log(LogLevel.Warn, f"Failed to load stylesheet {color(file, ColorCode.GRAY)}: {e}")

    return styles

def parse_scripts(soup: BeautifulSoup) -> list[File]:
    js_files: list[str] = []

    for script in soup.find_all("script"):
        if isinstance(script, Tag):
            src = str(script.get("src"))
            if src:
                # Make sure src is reference to file
                if not is_uri(src):
                    js_files.append(resolve_filepath(src))
                    script.decompose()

    scripts = []

    for file in js_files:
        try:
            contents = read_file(file)
            scripts.append((file, contents))
            log(LogLevel.Info, f"Loading script {color(file, ColorCode.GRAY)}")
        except FileNotFoundError:
            log(LogLevel.Warn, f"Missing script {color(file, ColorCode.GRAY)}")
        except IsADirectoryError:
            log(LogLevel.Warn, f"Expected script, got stylesheet {color(file, ColorCode.GRAY)}")
        except Exception as e:
            log(LogLevel.Warn, f"Failed to load script {color(file, ColorCode.GRAY)}: {e}")
            
    return scripts

def add_css(soup: BeautifulSoup, jsdelivr_repo: Optional[str] = None) -> None:
    style_el = soup.new_tag("style")
    style_el.string = ""

    docs = parse_links(soup)

    for doc in docs:
        if jsdelivr_repo is None:
            # I think indent will always be 3? I could be wrong
            indent = (" "*INDENT_LEVEL)*3
            comment = f"/* {doc[0]} */"
            contents = doc[1].replace("\n", f"\n{indent}")
            full = f"\n{indent}{comment}\n\n{indent}{contents}\n\n"

            style_el.string += full
        else:
            url = jsdelivr_url(jsdelivr_repo, doc[0])
            _cdn_links.append(url)
            link = soup.new_tag("link")
            link["rel"] = "stylesheet"
            link["type"] = "text/css"
            link["href"] = url
            
            append_head(soup, link)

    # Don't embed empty style tag
    if style_el.string == "" and jsdelivr_repo is None:
        return
    append_head(soup, style_el)

def add_scripts(soup: BeautifulSoup, jsdelivr_repo: Optional[str] = None) -> None:
    scripts: list[File] = parse_scripts(soup)

    for script in scripts:
        script_tag = soup.new_tag("script")
        if not isinstance(script_tag, Tag):
            return
        if jsdelivr_repo is None:
            indent = (" "*INDENT_LEVEL)*3
            comment = f"// {script[0].removeprefix("./")}"
            contents = script[1].replace("\n", f"\n{indent}")
            full = f"\n{indent}{comment}\n\n{indent}{contents}"

            script_tag.string = full
        else:
            url = jsdelivr_url(jsdelivr_repo, script[0])
            _cdn_links.append(url)
            script_tag["defer"] = None # type: ignore
            script_tag["src"] = url

        body = soup.find("body")

        if body is not None and isinstance(body, Tag):
            if jsdelivr_repo is None and script_tag.string == "":
                continue
            body.append(script_tag)

def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("input", help="Filepath of the HTML file to use as a basis for compilation")
    parser.add_argument("--output", "-o", help="Where to write the compiled HTML")
    parser.add_argument("--github-url", "-gh", help="A github short url from which to pull CSS/JS files from via JSDelivr CDN. If provided, CSS/JS files will be embedded as JSDelivr links")
    parser.add_argument("--local", "-l", action="store_true", help="By default, if the current working directory is in a git repository, CSS/JS files will automatically be converted to JSDelivr links. Enabling this option forces all CSS/JS to be embedded directly")
    parser.add_argument("--gh-only-scripts", "-Os", action="store_true", help="If using JSDelivr, only embed JS files as JSDelivr links, and embed all CSS normally")
    parser.add_argument("--gh-only-css", "-Oc", action="store_true", help="If using JSDelivr, only embed CSS files as JSDelivr links, and embed all JS normally")
    parser.add_argument("--single-file-out", "-So", help="Where to output the single-file loader for the HTML. Single-file will not be generated if not provided, or if not using JsDelivr")
    parser.add_argument("--no-purge", "-np", action="store_true", help="Do not generate a .jsdelivr.purge file")

    args = parser.parse_args()
    
    inp_file = args.input
    github_url = args.github_url
    use_local = args.local
    scripts_only = args.gh_only_scripts
    css_only = args.gh_only_css
    sf_out = args.single_file_out
    no_purge = args.no_purge
        
    global _input_path
    _input_path = inp_file
    
    default_output = resolve_filepath("index.min.html")
    output = args.output if args.output is not None else default_output
    
    loader_output = output
    if args.output is not None:
        loader_output = resolve_repo_fp(output)
    
    # I know this is ugly, no need to let me know
    rel_path = resolve_repo_fp(str(Path(_input_path).parent.resolve()))
    log(LogLevel.Info, f"Using asset root {color(rel_path, ColorCode.GRAY)}")
    
    # Automatically detect repo
    if in_repo():
        url = get_short_url()
        log(LogLevel.Info, f"Using repository {color(str(url), ColorCode.GRAY)}")
        if github_url is None:
            github_url = url
            
    if use_local == True:
        github_url = None

    log(LogLevel.Info, f"Parsing HTML {color(Path(inp_file).as_posix(), ColorCode.GRAY)}")
    html = read_file(inp_file)
    if html == "":
        return
    soup = BeautifulSoup(html, "html.parser")

    if scripts_only and not css_only:
        css_cdn = None
        scripts_cdn = github_url
    elif css_only and not scripts_only:
        css_cdn = github_url
        scripts_cdn = None
    else:
        css_cdn = github_url
        scripts_cdn = github_url

    add_css(soup, css_cdn)
    add_scripts(soup, scripts_cdn)

    write_output(output, loader_output, sf_out, github_url, no_purge, soup)

if __name__ == "__main__":
    main()