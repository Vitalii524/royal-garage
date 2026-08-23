async function loadBusinessCategories() {
    const categoriesContainer =
        document.getElementById("businessCategories");

    const emptyState =
        document.getElementById("businessEmptyState");

    if (!categoriesContainer || !emptyState) {
        return;
    }

    try {
        const response =
            await fetch("/api/businesses/categories");

        const data =
            await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(
                data.message ||
                "Не вдалося завантажити категорії."
            );
        }

        const categories =
            Array.isArray(data.categories)
                ? data.categories
                : [];

        categoriesContainer.innerHTML = "";

        if (categories.length === 0) {
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;

        categories.forEach((category) => {
            const link =
                document.createElement("a");

            link.className =
                "business-category-card";

            link.href =
                `business-list.html?type=${encodeURIComponent(
                    category.code
                )}`;

            const title =
                document.createElement("h2");

            title.textContent =
                category.name;

            const count =
                document.createElement("p");

            const businessCount =
                Number(category.businessCount) || 0;

            count.textContent =
                `${businessCount} ${
                    businessCount === 1
                        ? "бізнес"
                        : "бізнесів"
                }`;

            link.appendChild(title);
            link.appendChild(count);

            categoriesContainer.appendChild(link);
        });

    } catch (error) {
        console.error(
            "Business categories load error:",
            error
        );

        categoriesContainer.innerHTML = "";

        emptyState.hidden = false;

        const title =
            emptyState.querySelector("h2");

        const text =
            emptyState.querySelector("p");

        if (title) {
            title.textContent =
                "Не вдалося завантажити каталог";
        }

        if (text) {
            text.textContent =
                "Спробуйте оновити сторінку пізніше.";
        }
    }
}

loadBusinessCategories();