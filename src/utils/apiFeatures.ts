interface Query {
  find(arg: Record<string, unknown>): Query;
  sort(arg: string): Query;
  select(arg: string): Query;
  skip(arg: number): Query;
  limit(arg: number): Query;
}

interface QueryString {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: string | undefined;
}

class APIFeatures {
  query: Query;
  queryString: QueryString;

  constructor(query: Query, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): APIFeatures {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
    ];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort(): APIFeatures {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort
        .split(",")
        .join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields(): APIFeatures {
    if (this.queryString.fields) {
      const fields = this.queryString.fields
        .split(",")
        .join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate(): APIFeatures {
    const page = this.queryString.page
      ? parseInt(this.queryString.page)
      : 1;
    const limit = this.queryString.limit
      ? parseInt(this.queryString.limit)
      : 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
