# Vislet

This is Nextjs and Airflow project. The frontend is deployed to Vercel and the Airflow portion uses MWAA.

## Development workflow

To get started:

- `$ npm run dev`

## Deploying for Next.js

Just merge to master and it auto deploys to vercel.

## Deploying Airflow

Start an [Amazon MWAA](https://aws.amazon.com/managed-workflows-for-apache-airflow/)

To setup CI, setup [encrypted secrets](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

```
	AWS_S3_BUCKET
	AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
```

## TODO

- Gulp should run tests
- auto-deploy on commit via Travis

# Airflow

First setup the VPC (https://docs.aws.amazon.com/mwaa/latest/userguide/vpc-create.html) and on page two of the configuration, select 'Create VPC' and select public.
