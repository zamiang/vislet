module.exports.init = () => {
    var $header, pathName;
    $header = $(".vislet-intro");
    if (!($header.length > 0)) {
        return;
    }
    pathName = window.location.pathname.replace(/\/$/, "");
    return $header.find(".items a").each((index, item) => {
        var $item, href;
        $item = $(item);
        href = $item.attr("href");
        if (href === pathName) {
            return $item.addClass("active");
        }
    });
};
