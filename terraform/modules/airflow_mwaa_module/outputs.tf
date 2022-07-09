# Output values
output "created_at" {
  value       = aws_mwaa_environment.vislet.created_at
  description = "The Created At date of the MWAA Environment"
}

output "status" {
  value       = aws_mwaa_environment.vislet.status
  description = "The status of the Amazon MWAA Environment"
}

output "webserver_url" {
  value       = aws_mwaa_environment.vislet.webserver_url
  description = "Webserver URL of the MWAA environment as type = string"
}

output "log_group_arns" {
  value       = aws_mwaa_environment.vislet.logging_configuration
  description = "Cloudwatch ARNS for log groups as type = dict"
}
